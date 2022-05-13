import { useSpring, animated } from 'react-spring';

export function FadeIn(props: any) {
  const style = useSpring({
    opacity: 1,
    from: { opacity: 0 },
    config: {
      duration: 200,
    },
  });
  return (
    <animated.div style={style} className={props.className}>
      {props.children}
    </animated.div>
  );
}
