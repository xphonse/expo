import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { getAvailableProjectTemplatesAsync } from '../ProjectTemplates';
import { Directories } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

async function promptToUseNextTag(): Promise<boolean> {
  const choices = ['Tag this version only as "next"', 'Keep previous selections'];
  const { selection } = await inquirer.prompt<{ selection: string }>([
    {
      type: 'list',
      name: 'selection',
      message: 'This version string appears to be prerelease. Options:',
      choices,
    },
  ]);
  return selection === choices[0];
}

async function promptForCustomTagAsync(): Promise<string> {
  const { customTag } = await inquirer.prompt<{ customTag: string }>([
    {
      type: 'input',
      name: 'customTag',
      message: 'Enter custom tag string:',
      default: 'custom',
      validate(value: string) {
        if (!value.match(/[a-zA-Z]/)) {
          return 'Tag must have at least one alpha character';
        }
        if (value[0].match(/[0-9]/)) {
          return `${value} starts with a number and is not recommended as a tag.`;
        }
        if (value[0] === 'v') {
          return `${value} starts with "v" and is not recommended as a tag.`;
        }
        if (semver.valid(value)) {
          return `${value} is a version string and not recommended as a tag.`;
        }
        return true;
      },
    },
  ]);
  return customTag;
}

async function action(options) {
  // Uncomment the line below when testing changes to this script
  // to prevent accidental npm publishing and tagging
  // options.dry = true;
  if (!options.sdkVersion) {
    const { version: expoSdkVersion } = await JsonFile.readAsync<{ version: string }>(
      path.join(EXPO_DIR, 'packages/expo/package.json')
    );
    const { sdkVersion } = await inquirer.prompt<{ sdkVersion: string }>([
      {
        type: 'input',
        name: 'sdkVersion',
        message:
          "What is the Expo SDK version the project templates you're going to publish are compatible with?",
        default: `${semver.major(expoSdkVersion)}.0.0`,
        validate(value) {
          if (!semver.valid(value)) {
            return `${value} is not a valid version.`;
          }
          return true;
        },
      },
    ]);
    options.sdkVersion = sdkVersion;
  }

  const sdkTag = `sdk-${semver.major(options.sdkVersion)}`;

  const tagOptions = new Map<string, string[]>();
  tagOptions.set(`${sdkTag} and latest`, [sdkTag, 'latest']);
  tagOptions.set(`${sdkTag} and beta`, [sdkTag, 'beta']);
  tagOptions.set(sdkTag, [sdkTag]);

  const { tagChoice } = await inquirer.prompt<{ tagChoice: string }>([
    {
      type: 'list',
      name: 'tagChoice',
      prefix: '❔',
      message: 'Which tags would you like to use?',
      choices: [...tagOptions.keys(), 'custom'],
    },
  ]);

  const tags =
    tagChoice === 'custom' ? [await promptForCustomTagAsync()] : tagOptions.get(tagChoice);

  const npmPublishTag = tags ? tags[0] : sdkTag; // Will either be the sdk-xx tag, or a custom string

  const availableProjectTemplates = await getAvailableProjectTemplatesAsync();
  const projectTemplatesToPublish = options.project
    ? availableProjectTemplates.filter(({ name }) => name.includes(options.project))
    : availableProjectTemplates;

  if (projectTemplatesToPublish.length === 0) {
    console.log(
      chalk.yellow('No project templates to publish. Make sure --project flag is correct.')
    );
    return;
  }

  console.log('\nFollowing project templates will be published:');
  console.log(
    projectTemplatesToPublish.map(({ name }) => chalk.green(name)).join(chalk.grey(', ')),
    '\n'
  );

  for (const template of projectTemplatesToPublish) {
    const { newVersion } = await inquirer.prompt<{ newVersion: string }>([
      {
        type: 'input',
        name: 'newVersion',
        message: `What is the new version for ${chalk.green(template.name)} package?`,
        default: semver.lt(template.version, options.sdkVersion)
          ? options.sdkVersion
          : semver.inc(template.version, 'patch'),
        validate(value) {
          if (!semver.valid(value)) {
            return `${value} is not a valid version.`;
          }
          if (semver.lt(value, template.version)) {
            return `${value} shouldn't be lower than the current version (${template.version})`;
          }
          return true;
        },
      },
    ]);

    const choseNextTag = semver.prerelease(newVersion) ? await promptToUseNextTag() : false;

    // Update package version in `package.json`
    await JsonFile.setAsync(path.join(template.path, 'package.json'), 'version', newVersion);

    const appJsonPath = path.join(template.path, 'app.json');
    if (
      (await fs.pathExists(appJsonPath)) &&
      (await JsonFile.getAsync(appJsonPath, 'expo.sdkVersion', null))
    ) {
      // Make sure SDK version in `app.json` is correct
      console.log(
        `Setting ${chalk.magenta('expo.sdkVersion')} to ${chalk.green(
          options.sdkVersion
        )} in template's app.json...`
      );

      await JsonFile.setAsync(
        path.join(template.path, 'app.json'),
        'expo.sdkVersion',
        options.sdkVersion
      );
    }

    console.log(`Publishing ${chalk.green(template.name)}@${chalk.red(newVersion)}...`);

    const moreArgs: string[] = [];

    // Assign custom tag in the publish command, so we don't accidentally publish as latest.
    moreArgs.push('--tag', choseNextTag ? 'next' : npmPublishTag);

    const logMessagePrefix = options.dry ? 'Dry run: ' : 'Command to execute: ';

    // Publish to NPM registry
    console.log(logMessagePrefix + 'npm publish ' + ['--access', 'public', ...moreArgs].join(' '));
    options.dry ||
      (await spawnAsync('npm', ['publish', '--access', 'public', ...moreArgs], {
        stdio: 'inherit',
        cwd: template.path,
      }));

    if (tags && tags.length === 2 && !choseNextTag) {
      // If 'next', do not add 'latest' or 'beta'
      // Additional tag (latest, beta) is added here
      console.log(
        `Assigning ${chalk.blue(`${tags[1]}`)} tag to ${chalk.green(template.name)}@${chalk.red(
          newVersion
        )}...`
      );

      // Add the tag to the new version
      console.log(
        logMessagePrefix +
          'npm ' +
          ['dist-tag', 'add', `${template.name}@${newVersion}`, `${tags[1]}`].join(' ')
      );
      options.dry ||
        (await spawnAsync(
          'npm',
          ['dist-tag', 'add', `${template.name}@${newVersion}`, `${tags[1]}`],
          {
            stdio: 'inherit',
            cwd: template.path,
          }
        ));
    }
    console.log();
  }
}

export default (program) => {
  program
    .command('publish-project-templates')
    .alias('publish-templates', 'ppt')
    .option(
      '-s, --sdkVersion [string]',
      'Expo SDK version that the templates are compatible with. (optional)'
    )
    .option('-p, --project [string]', 'Name of the template project to publish. (optional)')
    .option('-d, --dry', 'Run the script in the dry mode, that is without publishing.')
    .description('Publishes project templates under `templates` directory.')
    .asyncAction(action);
};
