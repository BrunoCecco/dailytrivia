import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Eye, Lock } from 'lucide-react-native';

export function TomorrowPreview() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calendar size={24} color="#EC4899" />
        <Text style={styles.title}>Tomorrow's Preview</Text>
      </View>
      
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Eye size={20} color="#9CA3AF" />
          <Text style={styles.previewTitle}>Sneak Peek</Text>
        </View>
        
        <Text style={styles.previewText}>
          Tomorrow's quiz will focus on Space Exploration and Ancient History. 
          Get ready for questions about NASA missions and Roman civilization!
        </Text>
        
        <View style={styles.categories}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>Space</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>History</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.unlockButton}>
        <Lock size={16} color="#F59E0B" />
        <Text style={styles.unlockText}>Unlock Bonus Hint</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  previewCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  categories: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#4B5563',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  unlockText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});