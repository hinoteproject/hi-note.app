import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, Shadows } from '../constants/theme';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date, mode: 'day' | 'month' | 'year') => void;
  initialDate?: Date;
  minDate?: Date;
}

const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function DatePickerModal({
  visible,
  onClose,
  onSelect,
  initialDate,
  minDate,
}: DatePickerModalProps) {
  // Flow: day -> month -> year -> done
  const now = new Date();
  const [step, setStep] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(now.getMonth());
  const [viewYear, setViewYear] = useState<number>(now.getFullYear());

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      const date = initialDate && initialDate instanceof Date && !isNaN(initialDate.getTime()) 
        ? initialDate 
        : new Date();
      setStep('day');
      setSelectedDay(date.getDate());
      setSelectedMonth(date.getMonth());
      setSelectedYear(date.getFullYear());
      setViewMonth(date.getMonth());
      setViewYear(date.getFullYear());
    }
  }, [visible]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Step 1: Chọn ngày -> chuyển sang chọn tháng
  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    setSelectedMonth(viewMonth);
    setSelectedYear(viewYear);
    setStep('month'); // Chuyển sang bước chọn tháng
  };

  // Step 2: Chọn tháng -> chuyển sang chọn năm
  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setStep('year'); // Chuyển sang bước chọn năm
  };

  // Step 3: Chọn năm -> hoàn tất
  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    // Tạo date cuối cùng và gọi onSelect
    const finalDate = new Date(year, selectedMonth, selectedDay);
    onSelect(finalDate, 'day');
    onClose();
  };

  const isToday = (day: number) => {
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isSelectedDay = (day: number) => {
    return (
      viewYear === selectedYear &&
      viewMonth === selectedMonth &&
      day === selectedDay
    );
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const minYear = minDate ? minDate.getFullYear() : currentYear - 10;
    const years: number[] = [];
    for (let y = currentYear + 1; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  };

  // Quick select
  const handleQuickSelect = (type: 'today' | 'yesterday' | 'thisMonth' | 'lastMonth') => {
    const now = new Date();
    let date: Date;
    let mode: 'day' | 'month' = 'day';

    switch (type) {
      case 'today':
        date = now;
        mode = 'day';
        break;
      case 'yesterday':
        date = new Date(now.getTime() - 86400000);
        mode = 'day';
        break;
      case 'thisMonth':
        date = new Date(now.getFullYear(), now.getMonth(), 1);
        mode = 'month';
        break;
      case 'lastMonth':
        date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        mode = 'month';
        break;
      default:
        date = now;
    }

    onSelect(date, mode);
    onClose();
  };

  const getStepTitle = () => {
    switch (step) {
      case 'day': return '1️⃣ Chọn ngày';
      case 'month': return '2️⃣ Chọn tháng';
      case 'year': return '3️⃣ Chọn năm';
    }
  };

  const getSelectedPreview = () => {
    return `${selectedDay}/${selectedMonth + 1}/${selectedYear}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Chọn ngày</Text>
              <Text style={styles.stepText}>{getStepTitle()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Progress indicator */}
          <View style={styles.progress}>
            <View style={[styles.progressDot, step === 'day' && styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, step === 'month' && styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, step === 'year' && styles.progressDotActive]} />
          </View>

          {/* Quick Select */}
          <View style={styles.quickSelect}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleQuickSelect('today')}>
              <Text style={styles.quickBtnText}>Hôm nay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleQuickSelect('yesterday')}>
              <Text style={styles.quickBtnText}>Hôm qua</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleQuickSelect('thisMonth')}>
              <Text style={styles.quickBtnText}>Tháng này</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleQuickSelect('lastMonth')}>
              <Text style={styles.quickBtnText}>Tháng trước</Text>
            </TouchableOpacity>
          </View>

          {/* Step 1: Day Selection */}
          {step === 'day' && (
            <View style={styles.calendarContainer}>
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
                  <Text style={styles.navBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.navTitle}>
                  {MONTHS[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
                  <Text style={styles.navBtnText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day) => (
                  <Text key={day} style={styles.weekdayText}>{day}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {generateCalendarDays().map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      day !== null && isToday(day) ? styles.dayCellToday : undefined,
                      day !== null && isSelectedDay(day) ? styles.dayCellSelected : undefined,
                    ]}
                    onPress={() => day !== null && handleDaySelect(day)}
                    disabled={day === null}
                  >
                    {day !== null && (
                      <Text
                        style={[
                          styles.dayText,
                          isToday(day) ? styles.dayTextToday : undefined,
                          isSelectedDay(day) ? styles.dayTextSelected : undefined,
                        ]}
                      >
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 2: Month Selection */}
          {step === 'month' && (
            <View style={styles.monthContainer}>
              <View style={styles.selectedPreview}>
                <Text style={styles.previewLabel}>Ngày đã chọn:</Text>
                <Text style={styles.previewValue}>{selectedDay}</Text>
              </View>

              <Text style={styles.sectionTitle}>Chọn tháng cho ngày {selectedDay}:</Text>
              
              <View style={styles.monthsGrid}>
                {MONTHS.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthCell,
                      index === selectedMonth ? styles.monthCellSelected : undefined,
                    ]}
                    onPress={() => handleMonthSelect(index)}
                  >
                    <Text
                      style={[
                        styles.monthText,
                        index === selectedMonth ? styles.monthTextSelected : undefined,
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('day')}>
                <Text style={styles.backBtnText}>← Quay lại chọn ngày</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Year Selection */}
          {step === 'year' && (
            <View style={styles.yearContainer}>
              <View style={styles.selectedPreview}>
                <Text style={styles.previewLabel}>Đã chọn:</Text>
                <Text style={styles.previewValue}>{selectedDay}/{selectedMonth + 1}</Text>
              </View>

              <Text style={styles.sectionTitle}>Chọn năm:</Text>
              
              <ScrollView style={styles.yearScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.yearsGrid}>
                  {generateYears().map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearCell,
                        year === selectedYear ? styles.yearCellSelected : undefined,
                        year === today.getFullYear() ? styles.yearCellCurrent : undefined,
                      ]}
                      onPress={() => handleYearSelect(year)}
                    >
                      <Text
                        style={[
                          styles.yearText,
                          year === selectedYear ? styles.yearTextSelected : undefined,
                          year === today.getFullYear() ? styles.yearTextCurrent : undefined,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('month')}>
                <Text style={styles.backBtnText}>← Quay lại chọn tháng</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  stepText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: Colors.textMuted,
  },

  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },

  quickSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.greenBg,
    borderWidth: 1,
    borderColor: Colors.green,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.green,
  },

  calendarContainer: {
    marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: '300',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  dayCellToday: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },

  monthContainer: {
    marginBottom: 16,
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  monthCell: {
    width: '31%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
  },
  monthCellSelected: {
    backgroundColor: Colors.primary,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  monthTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },

  yearContainer: {
    marginBottom: 16,
  },
  yearScroll: {
    maxHeight: 220,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  yearCell: {
    width: '23%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
  },
  yearCellSelected: {
    backgroundColor: Colors.primary,
  },
  yearCellCurrent: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  yearText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  yearTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  yearTextCurrent: {
    color: Colors.primary,
  },

  backBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
