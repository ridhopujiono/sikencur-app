import React, { useMemo } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function FadeInView({
  children,
  delay = 0,
  duration = 360,
  offset = 14,
  ...props
}) {
  const entering = useMemo(
    () =>
      FadeInDown.delay(delay)
        .duration(duration)
        .withInitialValues({
          opacity: 0,
          transform: [{ translateY: offset }],
        }),
    [delay, duration, offset],
  );

  return (
    <Animated.View entering={entering} {...props}>
      {children}
    </Animated.View>
  );
}
