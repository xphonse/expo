/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0renderer/attributedstring/AttributedString.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/ViewEventEmitter.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

class TextInputMetrics {
 public:
  std::string text;
  AttributedString::Range selectionRange;
  // ScrollView-like metrics
  Size contentSize;
  Point contentOffset;
  EdgeInsets contentInset;
  Size containerSize;
  int eventCount;
  Size layoutMeasurement;
  float zoomScale;
};

class KeyPressMetrics {
 public:
  std::string text;
  int eventCount;
};

class TextInputEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onFocus(TextInputMetrics const &textInputMetrics) const;
  void onBlur(TextInputMetrics const &textInputMetrics) const;
  void onChange(TextInputMetrics const &textInputMetrics) const;
  void onChangeSync(TextInputMetrics const &textInputMetrics) const;
  void onContentSizeChange(TextInputMetrics const &textInputMetrics) const;
  void onSelectionChange(TextInputMetrics const &textInputMetrics) const;
  void onEndEditing(TextInputMetrics const &textInputMetrics) const;
  void onSubmitEditing(TextInputMetrics const &textInputMetrics) const;
  void onKeyPress(KeyPressMetrics const &textInputMetrics) const;
  void onKeyPressSync(KeyPressMetrics const &textInputMetrics) const;
  void onScroll(TextInputMetrics const &textInputMetrics) const;

 private:
  void dispatchTextInputEvent(
      std::string const &name,
      TextInputMetrics const &textInputMetrics,
      EventPriority priority = EventPriority::AsynchronousBatched) const;
};

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
