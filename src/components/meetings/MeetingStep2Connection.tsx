import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';

const PROMPTS = [
  'Share something you appreciate about each family member.',
  'What was the best part of your week?',
  'Tell everyone something that made you smile recently.',
  'What is something kind someone did for you this week?',
  'Share a favorite memory from the past week.',
];

interface Props {
  initialTopic?: string;
  onComplete: (topic: string) => void;
}

export function MeetingStep2Connection({ initialTopic, onComplete }: Props) {
  const { colors } = useTheme();
  const [topic, setTopic] = useState(initialTopic || '');
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null);

  const handleSelectPrompt = (index: number) => {
    setSelectedPrompt(index);
    setTopic(PROMPTS[index]);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Start with something positive! Choose a prompt or create your own.
      </Text>

      <View style={styles.promptsContainer}>
        {PROMPTS.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.promptCard, selectedPrompt === index && styles.promptCardActive]}
            onPress={() => handleSelectPrompt(index)}
          >
            <Ionicons
              name={selectedPrompt === index ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={selectedPrompt === index ? colors.primary : colors.textTertiary}
            />
            <Text style={[styles.promptText, selectedPrompt === index && styles.promptTextActive]}>
              {prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.orText}>or write your own:</Text>

      <TextInput
        style={styles.input}
        value={topic}
        onChangeText={(text) => {
          setTopic(text);
          setSelectedPrompt(null);
        }}
        placeholder="What positive topic did you discuss?"
        placeholderTextColor={colors.textTertiary}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.nextButton, !topic.trim() && styles.nextButtonDisabled]}
        onPress={() => onComplete(topic.trim())}
        disabled={!topic.trim()}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16 },
    instruction: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
    promptsContainer: { gap: 8, marginBottom: 16 },
    promptCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 14, borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1, borderColor: 'transparent',
    },
    promptCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '11' },
    promptText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
    promptTextActive: { color: colors.primary, fontWeight: '500' },
    orText: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', marginVertical: 12 },
    input: {
      backgroundColor: colors.input, borderWidth: 1, borderColor: colors.inputBorder,
      borderRadius: 12, padding: 14, fontSize: 16, color: colors.text,
      minHeight: 80, textAlignVertical: 'top', marginBottom: 24,
    },
    nextButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, padding: 16, borderRadius: 12, minHeight: 52,
    },
    nextButtonDisabled: { opacity: 0.5 },
    nextButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
  });
}
