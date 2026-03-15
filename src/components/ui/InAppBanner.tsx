import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';

export interface BannerConfig {
  id: string;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

interface InAppBannerProps {
  banner: BannerConfig | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function InAppBanner({ banner, onDismiss, autoDismissMs = 5000 }: InAppBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!banner) return;

    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => dismiss(), autoDismissMs);
    return () => clearTimeout(timer);
  }, [banner?.id]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!banner) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={[styles.banner, { backgroundColor: banner.bgColor, borderLeftColor: banner.color }]}>
        <Ionicons name={banner.icon} size={22} color={banner.color} />
        <View style={styles.textSection}>
          <Text style={[styles.title, { color: banner.color }]}>{banner.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{banner.message}</Text>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Pre-built banner configurations
export function gradeApprovedBanner(subject: string, grade: string): BannerConfig {
  return {
    id: `grade-approved-${Date.now()}`,
    title: 'Grade Approved!',
    message: `Your ${grade} in ${subject} has been approved by your parent.`,
    icon: 'checkmark-circle',
    color: '#16A34A',
    bgColor: '#F0FDF4',
  };
}

export function assessmentApprovedBanner(date: string): BannerConfig {
  return {
    id: `assessment-approved-${Date.now()}`,
    title: 'Assessment Approved!',
    message: `Your behavior assessment for ${date} was approved.`,
    icon: 'shield-checkmark',
    color: '#2563EB',
    bgColor: '#EFF6FF',
  };
}

export function newAssessmentBanner(parentName: string): BannerConfig {
  return {
    id: `new-assessment-${Date.now()}`,
    title: 'New Assessment',
    message: `${parentName} submitted a behavior assessment for you.`,
    icon: 'document-text',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
  };
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 30,
    left: 12,
    right: 12,
    zIndex: 998,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  textSection: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  message: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 16 },
});
