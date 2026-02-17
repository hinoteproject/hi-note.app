import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Colors } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date, mode: 'day' | 'month' | 'year') => void;
  initialDate?: Date;
  minDate?: Date;
}

const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function DatePickerModal({ visible, onClose, onSelect, initialDate, minDate }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tempDay, setTempDay] = useState(1);
  const [tempMonth, setTempMonth] = useState(0);
  const [tempYear, setTempYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(0);
  const [viewYear, setViewYear] = useState(2026);

  useEffect(() => {
    if (visible) {
      const d = initialDate || new Date();
      setStep(1);
      setTempDay(d.getDate());
      setTempMonth(d.getMonth());
      setTempYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    }
  }, [visible]);

  const today = new Date();
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

  const calendarDays = () => {
    const days: (number | null)[] = [];
    const firstDay = getFirstDay(viewYear, viewMonth);
    const totalDays = getDaysInMonth(viewYear, viewMonth);
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day: number) => {
    setTempDay(day);
    setTempMonth(viewMonth);
    setTempYear(viewYear);
    setStep(2);
  };

  const selectMonth = (m: number) => {
    setTempMonth(m);
    setStep(3);
  };

  const selectYear = (y: number) => {
    const finalDate = new Date(y, tempMonth, tempDay);
    onSelect(finalDate, 'day');
    onClose();
  };

  const quickSelect = (type: 'today' | 'yesterday' | 'thisMonth' | 'lastMonth') => {
    const now = new Date();
    let date: Date;
    let mode: 'day' | 'month' = 'day';
    if (type === 'today') date = now;
    else if (type === 'yesterday') date = new Date(now.getTime() - 86400000);
    else if (type === 'thisMonth') { date = new Date(now.getFullYear(), now.getMonth(), 1); mode = 'month'; }
    else { date = new Date(now.getFullYear(), now.getMonth() - 1, 1); mode = 'month'; }
    onSelect(date, mode);
    onClose();
  };

  const isToday = (day: number) => viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  const isSelected = (day: number) => viewYear === tempYear && viewMonth === tempMonth && day === tempDay;

  const years: number[] = [];
  for (let y = today.getFullYear() + 1; y >= 2020; y--) years.push(y);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{step === 1 ? '📅 Chọn ngày' : step === 2 ? '📅 Chọn tháng' : '📅 Chọn năm'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.progress}>
            <View style={[styles.dot, step >= 1 && styles.dotActive]} />
            <View style={styles.line} />
            <View style={[styles.dot, step >= 2 && styles.dotActive]} />
            <View style={styles.line} />
            <View style={[styles.dot, step >= 3 && styles.dotActive]} />
          </View>
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => quickSelect('today')}><Text style={styles.quickTxt}>Hôm nay</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => quickSelect('yesterday')}><Text style={styles.quickTxt}>Hôm qua</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => quickSelect('thisMonth')}><Text style={styles.quickTxt}>Tháng này</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => quickSelect('lastMonth')}><Text style={styles.quickTxt}>Tháng trước</Text></TouchableOpacity>
          </View>

          {step === 1 && (
            <View>
              <View style={styles.navRow}>
                <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={styles.navTxt}>‹</Text></TouchableOpacity>
                <Text style={styles.navTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
                <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={styles.navTxt}>›</Text></TouchableOpacity>
              </View>
              <View style={styles.weekRow}>{WEEKDAYS.map(w => <Text key={w} style={styles.weekTxt}>{w}</Text>)}</View>
              <View style={styles.daysGrid}>
                {calendarDays().map((day, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[
                      styles.dayCell, 
                      day !== null && isToday(day) ? styles.dayCellToday : undefined, 
                      day !== null && isSelected(day) ? styles.dayCellSelected : undefined
                    ]} 
                    onPress={() => day !== null && selectDay(day)} 
                    disabled={day === null}
                  >
                    {day !== null && (
                      <Text style={[
                        styles.dayTxt, 
                        isToday(day) ? styles.dayTxtToday : undefined, 
                        isSelected(day) ? styles.dayTxtSelected : undefined
                      ]}>
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <View style={styles.previewBox}><Text style={styles.previewLabel}>Ngày đã chọn:</Text><Text style={styles.previewVal}>{tempDay}</Text></View>
              <View style={styles.monthGrid}>
                {MONTHS.map((m, i) => (
                  <TouchableOpacity key={m} style={[styles.monthCell, i === tempMonth && styles.monthCellActive]} onPress={() => selectMonth(i)}>
                    <Text style={[styles.monthTxt, i === tempMonth && styles.monthTxtActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}><Text style={styles.backTxt}>← Quay lại</Text></TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View>
              <View style={styles.previewBox}><Text style={styles.previewLabel}>Đã chọn:</Text><Text style={styles.previewVal}>{tempDay}/{tempMonth + 1}</Text></View>
              <ScrollView style={styles.yearScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.yearGrid}>
                  {years.map(y => {
                    const isActive = y === tempYear;
                    const isCurrent = y === today.getFullYear();
                    return (
                      <TouchableOpacity 
                        key={y} 
                        style={[
                          styles.yearCell, 
                          isCurrent && !isActive && styles.yearCellCurrent,
                          isActive && styles.yearCellActive,
                        ]} 
                        onPress={() => selectYear(y)}
                      >
                        <Text style={[
                          styles.yearTxt, 
                          isCurrent && !isActive && styles.yearTxtCurrent,
                          isActive && styles.yearTxtActive,
                        ]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}><Text style={styles.backTxt}>← Quay lại</Text></TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '85%' },
  handle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  closeTxt: { fontSize: 16, color: '#94a3b8' },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e2e8f0' },
  dotActive: { backgroundColor: Colors.primary, width: 12, height: 12, borderRadius: 6 },
  line: { width: 32, height: 2, backgroundColor: '#e2e8f0', marginHorizontal: 6 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#22c55e' },
  quickTxt: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  navTxt: { fontSize: 22, color: Colors.text },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekTxt: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  dayCellToday: { backgroundColor: '#dbeafe', borderWidth: 2, borderColor: Colors.primary },
  dayCellSelected: { backgroundColor: Colors.primary },
  dayTxt: { fontSize: 14, color: Colors.text },
  dayTxtToday: { color: Colors.primary, fontWeight: '700' },
  dayTxtSelected: { color: '#fff', fontWeight: '700' },
  previewBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbeafe', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  previewLabel: { fontSize: 13, color: '#64748b', marginRight: 8 },
  previewVal: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  monthCell: { width: '31%', paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
  monthCellActive: { backgroundColor: Colors.primary },
  monthTxt: { fontSize: 14, fontWeight: '500', color: Colors.text },
  monthTxtActive: { color: '#fff', fontWeight: '700' },
  yearScroll: { maxHeight: 200 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  yearCell: { width: '23%', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
  yearCellActive: { backgroundColor: Colors.primary },
  yearCellCurrent: { borderWidth: 2, borderColor: Colors.primary, backgroundColor: '#f1f5f9' },
  yearTxt: { fontSize: 15, fontWeight: '600', color: Colors.text },
  yearTxtActive: { color: '#ffffff', fontWeight: '700' },
  yearTxtCurrent: { color: Colors.primary, fontWeight: '700' },
  backBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  backTxt: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
