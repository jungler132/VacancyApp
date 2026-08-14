import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function ScreenBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#0C1524', '#07090F', '#0A101C']}
        locations={[0, 0.48, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0, 212, 161, 0.09)', 'transparent', 'rgba(90, 130, 255, 0.07)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 0.85 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  orbTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 212, 161, 0.08)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(80, 120, 255, 0.06)',
  },
});
