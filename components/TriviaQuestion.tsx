import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CircleCheck as CheckCircle, Circle } from 'lucide-react-native';
import { QuizQuestion } from '@/lib/supabase';

interface TriviaQuestionProps {
  question: QuizQuestion;
  onAnswer: (answerIndex: number) => void;
  selectedAnswer: number | null;
}

export function TriviaQuestion({ question, onAnswer, selectedAnswer }: TriviaQuestionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question_text}</Text>
      
      <View style={styles.optionsContainer}>
        {question.options?.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswer === index && styles.selectedOption
            ]}
            onPress={() => onAnswer(index)}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIcon}>
                {selectedAnswer === index ? (
                  <CheckCircle size={20} color="#6366F1" />
                ) : (
                  <Circle size={20} color="#6B7280" />
                )}
              </View>
              <Text style={[
                styles.optionText,
                selectedAnswer === index && styles.selectedOptionText
              ]}>
                {option.option_text}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  questionText: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366F1',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  selectedOptionText: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
});