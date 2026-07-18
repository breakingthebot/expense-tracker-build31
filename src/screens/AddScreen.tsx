// src/screens/AddScreen.tsx
// "Add" tab screen: renders the AddExpenseForm inside a ScrollView,
// and lists active recurring expense schedules. Features a "Manage Categories"
// button and modal allowing the user to create, rename, or delete custom
// categories using a gorgeous 12-color swatch, as well as set and edit monthly
// budget limits per category. Adapts style dynamically using useTheme.
// Connects to: src/components/AddExpenseForm.tsx, src/hooks/useExpenses.ts,
// src/utils/currency.ts, src/services/budgetStorage.ts, src/components/ThemeProvider.tsx
// Created: 2026-07-17

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AddExpenseForm, { AddFormSubmitData } from '../components/AddExpenseForm';
import BudgetProgressWidget from '../components/BudgetProgressWidget';
import { useExpenses } from '../hooks/useExpenses';
import { TabParamList } from '../types/navigation';
import { formatCents, parseDollarsToCents, centsToInputString } from '../utils/currency';
import { useTheme } from '../components/ThemeProvider';

const PALETTE_COLORS = [
  '#e34948', // Red
  '#e87ba4', // Pink
  '#4a3aa7', // Purple
  '#2a78d6', // Blue
  '#00a8cc', // Teal
  '#1baf7a', // Green
  '#008300', // Dark Green
  '#eda100', // Yellow
  '#eb6834', // Orange
  '#3f51b5', // Indigo
  '#795548', // Brown
  '#607d8b', // Slate
];

const PRESETS = [
  { emoji: '☕', note: 'Coffee', category: 'Food', amountCents: 500 },
  { emoji: '🚌', note: 'Bus Fare', category: 'Transportation', amountCents: 275 },
  { emoji: '🎬', note: 'Movie', category: 'Entertainment', amountCents: 1500 },
];

export default function AddScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TabParamList, 'Add'>>();
  const {
    expenses,
    submitting,
    addNewExpense,
    editExpense,
    addNewRecurringExpense,
    recurringSchedules,
    removeRecurringExpense,
    categories,
    addNewCategory,
    editCategoryName,
    removeCategory,
    budgetGoals,
    updateBudgetGoal,
    defaultTxType,
    setDefaultTxType,
    reorderCategoriesList,
  } = useExpenses();

  const editingExpense = route.params?.editingExpense;

  // Theme states
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Category modal states
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PALETTE_COLORS[3]); // Default to Blue
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);

  // Budget editing states inside the modal
  const [editingBudgetCatName, setEditingBudgetCatName] = useState<string | null>(null);
  const [editingBudgetText, setEditingBudgetText] = useState('');

  async function handleFormSubmit(input: AddFormSubmitData) {
    if (editingExpense) {
      await editExpense(editingExpense.id, {
        amountCents: input.amountCents,
        category: input.category,
        note: input.note,
        date: input.date,
        type: input.type,
      });
      navigation.setParams({ editingExpense: undefined });
      navigation.navigate('History');
    } else {
      if (input.isRecurring) {
        await addNewRecurringExpense({
          amountCents: input.amountCents,
          category: input.category,
          note: input.note,
          startDate: input.date,
          interval: input.interval ?? 'monthly',
          type: input.type,
        });
      } else {
        await addNewExpense({
          amountCents: input.amountCents,
          category: input.category,
          note: input.note,
          date: input.date,
          type: input.type,
        });
      }
      navigation.navigate('History');
    }
  }

  function handleCancelEdit() {
    navigation.setParams({ editingExpense: undefined });
    navigation.navigate('History');
  }

  async function handleCreateCategory() {
    setCatError(null);
    try {
      await addNewCategory(newCatName, newCatColor);
      setNewCatName('');
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Could not add category.');
    }
  }

  async function handleSaveRename(id: string) {
    setCatError(null);
    try {
      await editCategoryName(id, editingCatName);
      setEditingCatId(null);
      setEditingCatName('');
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Could not rename category.');
    }
  }

  async function handleDeleteCategory(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Auto-expire confirmation state after 3 seconds
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === id ? null : prev));
      }, 3000);
      return;
    }

    setCatError(null);
    try {
      await removeCategory(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Could not delete category.');
    }
  }

  async function handleSaveBudget(categoryName: string) {
    setCatError(null);
    const parsed = parseDollarsToCents(editingBudgetText);
    if (parsed === null || parsed < 0) {
      setCatError('Please enter a valid budget amount, e.g. 150.00');
      return;
    }
    try {
      await updateBudgetGoal(categoryName, parsed);
      setEditingBudgetCatName(null);
      setEditingBudgetText('');
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Could not save budget goal.');
    }
  }

  async function handleMoveCategory(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const listCopy = [...categories];
    const temp = listCopy[index];
    listCopy[index] = listCopy[newIndex];
    listCopy[newIndex] = temp;

    const orderedIds = listCopy.map((c) => c.id);
    try {
      await reorderCategoriesList(orderedIds);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Could not reorder categories.');
    }
  }

  async function handleQuickAddPreset(preset: typeof PRESETS[0]) {
    const finalCategory = categories.find((c) => c.name === preset.category)
      ? preset.category
      : (categories.find((c) => c.isSystem)?.name || categories[0]?.name || 'Other');

    const todayStr = new Date().toISOString().split('T')[0];

    try {
      await addNewExpense({
        amountCents: preset.amountCents,
        category: finalCategory,
        note: preset.note,
        date: todayStr,
        type: 'expense',
      });
      navigation.navigate('History');
    } catch (err) {
      // Handled in storage layer alerts
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <AddExpenseForm
          key={editingExpense?.id ?? 'new'}
          onSubmit={handleFormSubmit}
          submitting={submitting}
          categories={categories}
          defaultTxType={defaultTxType}
          onTypeChange={setDefaultTxType}
          editingExpense={editingExpense}
          onCancelEdit={handleCancelEdit}
        />

        {/* Quick Add Presets row */}
        {!editingExpense && (
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsTitle}>Quick Add Presets</Text>
            <View style={styles.presetsRow}>
              {PRESETS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetChip}
                  onPress={() => handleQuickAddPreset(preset)}
                  accessibilityRole="button"
                  accessibilityLabel={`Quick add ${preset.note} preset`}
                >
                  <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                  <View style={styles.presetTextCol}>
                    <Text style={styles.presetNote} numberOfLines={1}>
                      {preset.note}
                    </Text>
                    <Text style={styles.presetValue}>
                      {formatCents(preset.amountCents)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Budget Progress Widget */}
        {!editingExpense && (
          <BudgetProgressWidget
            expenses={expenses}
            categories={categories}
            budgetGoals={budgetGoals}
            onManagePress={() => {
              setCatError(null);
              setShowCatModal(true);
            }}
          />
        )}

        {/* Categories Settings Launcher (hidden in edit mode) */}
        {!editingExpense && (
          <View style={styles.configSection}>
            <TouchableOpacity
              style={styles.configButton}
              onPress={() => {
                setCatError(null);
                setShowCatModal(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Manage custom categories and budget targets"
            >
              <Text style={styles.configButtonText}>⚙️ Manage Categories & Budgets</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active recurring bill templates */}
        {!editingExpense && recurringSchedules.length > 0 && (
          <View style={styles.recurringSection}>
            <Text style={styles.sectionHeader}>Active Recurring Bills</Text>
            {recurringSchedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleCard}>
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleNote}>{schedule.note}</Text>
                  <Text style={styles.scheduleSubtext}>
                    {schedule.category} • {schedule.interval.charAt(0).toUpperCase() + schedule.interval.slice(1)} • Starts {schedule.startDate}
                  </Text>
                </View>
                <View style={styles.scheduleRight}>
                  <Text style={styles.scheduleAmount}>{formatCents(schedule.amountCents)}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeRecurringExpense(schedule.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete recurring schedule for ${schedule.note}`}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Manage Categories & Budgets Modal */}
      <Modal
        visible={showCatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Manage Categories & Budgets</Text>

            {/* Quick Add Sub-Form */}
            <View style={styles.modalAddCard}>
              <Text style={styles.modalSubLabel}>Add New Category</Text>
              <View style={styles.modalAddRow}>
                <TextInput
                  style={styles.modalAddInput}
                  value={newCatName}
                  onChangeText={setNewCatName}
                  placeholder="e.g. Subscriptions"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="New category name"
                />
                <TouchableOpacity
                  style={[styles.modalAddButton, !newCatName.trim() && styles.modalAddButtonDisabled]}
                  onPress={handleCreateCategory}
                  disabled={!newCatName.trim()}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalAddButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Color Swatch Picker */}
              <View style={styles.swatchGrid}>
                {PALETTE_COLORS.map((col) => {
                  const isChosen = newCatColor === col;
                  return (
                    <TouchableOpacity
                      key={col}
                      style={[
                        styles.swatchCircle,
                        { backgroundColor: col },
                        isChosen && styles.swatchCircleChosen,
                      ]}
                      onPress={() => setNewCatColor(col)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select color ${col}`}
                    />
                  );
                })}
              </View>
            </View>

            {/* Feedback messages */}
            {catError && <Text style={styles.modalError}>{catError}</Text>}

            {/* Scrollable list of existing categories */}
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {categories.map((cat, index) => {
                const isSystem = cat.id.startsWith('sys-');
                const isEditing = editingCatId === cat.id;
                const isConfirming = confirmDeleteId === cat.id;
                const isEditingBudget = editingBudgetCatName === cat.name;

                const catBudget = budgetGoals[cat.name] || 0;

                return (
                  <View key={cat.id} style={styles.modalRow}>
                    <View style={styles.modalRowLeft}>
                      {/* Reorder controls (up/down arrows) */}
                      <View style={styles.reorderCol}>
                        <TouchableOpacity
                          disabled={index === 0}
                          onPress={() => handleMoveCategory(index, 'up')}
                          accessibilityRole="button"
                          accessibilityLabel="Move category up"
                          style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                        >
                          <Text style={[styles.reorderArrow, index === 0 && styles.reorderArrowDisabled]}>▲</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={index === categories.length - 1}
                          onPress={() => handleMoveCategory(index, 'down')}
                          accessibilityRole="button"
                          accessibilityLabel="Move category down"
                          style={[styles.reorderBtn, index === categories.length - 1 && styles.reorderBtnDisabled]}
                        >
                          <Text style={[styles.reorderArrow, index === categories.length - 1 && styles.reorderArrowDisabled]}>▼</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Category color indicator */}
                      <View style={[styles.modalColorDot, { backgroundColor: cat.color }]} />

                      {isEditing ? (
                        <View style={styles.modalEditInputRow}>
                          <TextInput
                            style={styles.modalEditInput}
                            value={editingCatName}
                            onChangeText={setEditingCatName}
                            autoFocus
                            accessibilityLabel="Edit category name field"
                          />
                          <TouchableOpacity
                            style={styles.modalRenameButton}
                            onPress={() => handleSaveRename(cat.id)}
                            accessibilityRole="button"
                          >
                            <Text style={styles.modalRenameButtonText}>Rename</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.modalCancelRename}
                            onPress={() => setEditingCatId(null)}
                            accessibilityRole="button"
                          >
                            <Text style={styles.modalCancelRenameText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.categoryNameCol}>
                          <Text style={styles.modalCategoryName}>
                            {cat.name} {isSystem && <Text style={styles.modalSystemBadge}>(System)</Text>}
                          </Text>

                          {/* Category monthly budget targets settings */}
                          <View style={styles.budgetRow}>
                            {isEditingBudget ? (
                              <View style={styles.budgetEditInline}>
                                <TextInput
                                  style={styles.budgetInput}
                                  value={editingBudgetText}
                                  onChangeText={setEditingBudgetText}
                                  keyboardType="decimal-pad"
                                  placeholder="0.00"
                                  placeholderTextColor={colors.textMuted}
                                  autoFocus
                                  accessibilityLabel="Monthly budget target input"
                                />
                                <TouchableOpacity
                                  style={styles.budgetSaveButton}
                                  onPress={() => handleSaveBudget(cat.name)}
                                  accessibilityRole="button"
                                >
                                  <Text style={styles.budgetSaveButtonText}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.budgetCancelButton}
                                  onPress={() => setEditingBudgetCatName(null)}
                                  accessibilityRole="button"
                                >
                                  <Text style={styles.budgetCancelButtonText}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            ) : catBudget > 0 ? (
                              <View style={styles.budgetDisplayRow}>
                                <Text style={styles.budgetDisplayText}>
                                  Budget: <Text style={styles.budgetValue}>{formatCents(catBudget)}</Text>
                                </Text>
                                <TouchableOpacity
                                  onPress={() => {
                                    setEditingBudgetCatName(cat.name);
                                    setEditingBudgetText(centsToInputString(catBudget));
                                  }}
                                  accessibilityRole="button"
                                >
                                  <Text style={styles.budgetActionEdit}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => updateBudgetGoal(cat.name, 0)}
                                  accessibilityRole="button"
                                >
                                  <Text style={styles.budgetActionClear}>Clear</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                onPress={() => {
                                  setEditingBudgetCatName(cat.name);
                                  setEditingBudgetText('');
                                }}
                                accessibilityRole="button"
                              >
                                <Text style={styles.setBudgetLink}>＋ Set Monthly Budget</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Actions block */}
                    {!isSystem && !isEditing && (
                      <View style={styles.modalRowActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingCatId(cat.id);
                            setEditingCatName(cat.name);
                          }}
                          accessibilityRole="button"
                        >
                          <Text style={styles.modalRenameText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(cat.id)}
                          accessibilityRole="button"
                        >
                          <Text style={[styles.modalDeleteText, isConfirming && styles.modalDeleteTextConfirm]}>
                            {isConfirming ? 'Tap to Confirm' : 'Delete'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCatModal(false)}
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    configSection: {
      paddingHorizontal: 16,
      marginTop: 12,
    },
    configButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    configButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    recurringSection: {
      paddingHorizontal: 16,
      marginTop: 24,
    },
    sectionHeader: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },
    scheduleCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    scheduleDetails: {
      flex: 1,
      paddingRight: 12,
    },
    scheduleNote: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    scheduleSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    scheduleRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    scheduleAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    deleteButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? '#3d1c1c' : '#fde8e8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButtonText: {
      fontSize: 11,
      color: colors.error,
      fontWeight: 'bold',
    },
    // Modal Overlay Settings
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 460,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      maxHeight: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalAddCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 14,
    },
    modalSubLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    modalAddRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    modalAddInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      backgroundColor: colors.background,
      color: colors.text,
    },
    modalAddButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalAddButtonDisabled: {
      backgroundColor: colors.borderSecondary,
    },
    modalAddButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    swatchGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'space-between',
    },
    swatchCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    swatchCircleChosen: {
      borderColor: colors.text,
      transform: [{ scale: 1.15 }],
    },
    modalError: {
      color: colors.error,
      fontSize: 12,
      marginBottom: 10,
      textAlign: 'center',
    },
    modalList: {
      flex: 1,
      maxHeight: 250,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
    },
    modalListContent: {
      paddingHorizontal: 10,
    },
    modalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 10,
    },
    modalColorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 10,
    },
    categoryNameCol: {
      flex: 1,
    },
    modalCategoryName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    modalSystemBadge: {
      fontSize: 11,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    modalEditInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 6,
    },
    modalEditInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 13,
      backgroundColor: colors.background,
      color: colors.text,
    },
    modalRenameButton: {
      backgroundColor: colors.success,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    modalRenameButtonText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: 'bold',
    },
    modalCancelRename: {
      paddingHorizontal: 6,
    },
    modalCancelRenameText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    modalRowActions: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    modalRenameText: {
      fontSize: 13,
      color: colors.primary,
    },
    modalDeleteText: {
      fontSize: 13,
      color: colors.error,
    },
    modalDeleteTextConfirm: {
      fontWeight: '700',
      fontSize: 11,
    },
    modalCloseButton: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 14,
    },
    modalCloseButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 14,
    },
    // Budget Swatch Styles
    budgetRow: {
      paddingLeft: 0,
      marginTop: 6,
    },
    setBudgetLink: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '600',
    },
    budgetDisplayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    budgetDisplayText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    budgetValue: {
      fontWeight: '700',
      color: colors.text,
    },
    budgetActionEdit: {
      fontSize: 11,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    budgetActionClear: {
      fontSize: 11,
      color: colors.error,
      textDecorationLine: 'underline',
    },
    budgetEditInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    budgetInput: {
      width: 90,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 12,
      backgroundColor: colors.background,
      color: colors.text,
    },
    budgetSaveButton: {
      backgroundColor: colors.success,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    budgetSaveButtonText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: 'bold',
    },
    budgetCancelButton: {
      backgroundColor: colors.textSecondary,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    budgetCancelButtonText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: 'bold',
    },
    reorderCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginRight: 8,
    },
    reorderBtn: {
      padding: 4,
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
    },
    reorderBtnDisabled: {
      opacity: 0.3,
    },
    reorderArrow: {
      fontSize: 10,
      color: colors.text,
      fontWeight: 'bold',
    },
    reorderArrowDisabled: {
      color: colors.textMuted,
    },
    presetsContainer: {
      paddingHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
    },
    presetsTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    presetsRow: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    presetChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 6,
    },
    presetEmoji: {
      fontSize: 16,
    },
    presetTextCol: {
      flex: 1,
      flexDirection: 'column',
    },
    presetNote: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
    },
    presetValue: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 1,
    },
  });
