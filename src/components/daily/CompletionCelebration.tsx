import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

interface CompletionCelebrationProps {
  onDismiss: () => void;
  wasCorrect?: boolean;
}

export default function CompletionCelebration({ onDismiss, wasCorrect }: CompletionCelebrationProps) {
  const confettiRef = useRef<ConfettiCannon>(null);

  return (
    <View style={styles.container}>
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart
        fadeOut
      />

      <View style={styles.content}>
        <Text style={styles.title}>Great work today!</Text>
        <Text style={styles.subtitle}>
          {wasCorrect
            ? "Perfect! You aced today's question and completed your check-in."
            : 'You completed your daily check-in.'}
        </Text>

        <TouchableOpacity style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
