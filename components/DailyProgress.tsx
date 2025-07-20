import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DailyProgressProps {
  current: number;
  total: number;
}

export function DailyProgress({ current, total }: DailyProgressProps) {
  const progress = (current / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>Daily Progress</Text>
        <Text style={styles.progressCount}>{current}/{total}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  progressCount: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
});