/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIScrollView.h>

#import <ABI43_0_0React/ABI43_0_0RCTAutoInsetsProtocol.h>
#import <ABI43_0_0React/ABI43_0_0RCTDefines.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcherProtocol.h>
#import <ABI43_0_0React/ABI43_0_0RCTScrollableProtocol.h>
#import <ABI43_0_0React/ABI43_0_0RCTView.h>

@protocol UIScrollViewDelegate;

@interface ABI43_0_0RCTScrollView : ABI43_0_0RCTView <UIScrollViewDelegate, ABI43_0_0RCTScrollableProtocol, ABI43_0_0RCTAutoInsetsProtocol>

- (instancetype)initWithEventDispatcher:(id<ABI43_0_0RCTEventDispatcherProtocol>)eventDispatcher NS_DESIGNATED_INITIALIZER;

/**
 * The `ABI43_0_0RCTScrollView` may have at most one single subview. This will ensure
 * that the scroll view's `contentSize` will be efficiently set to the size of
 * the single subview's frame. That frame size will be determined somewhat
 * efficiently since it will have already been computed by the off-main-thread
 * layout system.
 */
@property (nonatomic, readonly) UIView *contentView;

/**
 * If the `contentSize` is not specified (or is specified as {0, 0}, then the
 * `contentSize` will automatically be determined by the size of the subview.
 */
@property (nonatomic, assign) CGSize contentSize;

/**
 * The underlying scrollView (TODO: can we remove this?)
 */
@property (nonatomic, readonly) UIScrollView *scrollView;

@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, assign) BOOL DEPRECATED_sendUpdatedChildFrames;
@property (nonatomic, assign) NSTimeInterval scrollEventThrottle;
@property (nonatomic, assign) BOOL centerContent;
@property (nonatomic, copy) NSDictionary *maintainVisibleContentPosition;
@property (nonatomic, assign) BOOL scrollToOverflowEnabled;
@property (nonatomic, assign) int snapToInterval;
@property (nonatomic, assign) BOOL disableIntervalMomentum;
@property (nonatomic, copy) NSArray<NSNumber *> *snapToOffsets;
@property (nonatomic, assign) BOOL snapToStart;
@property (nonatomic, assign) BOOL snapToEnd;
@property (nonatomic, copy) NSString *snapToAlignment;
@property (nonatomic, assign) BOOL inverted;

// NOTE: currently these event props are only declared so we can export the
// event names to JS - we don't call the blocks directly because scroll events
// need to be coalesced before sending, for performance reasons.
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onScrollBeginDrag;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onScroll;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onScrollToTop;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onScrollEndDrag;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onMomentumScrollBegin;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onMomentumScrollEnd;

@end

@interface ABI43_0_0RCTScrollView (Internal)

- (void)updateContentOffsetIfNeeded;

@end

ABI43_0_0RCT_EXTERN void ABI43_0_0RCTSendFakeScrollEvent(id<ABI43_0_0RCTEventDispatcherProtocol> eventDispatcher, NSNumber *ABI43_0_0ReactTag);
