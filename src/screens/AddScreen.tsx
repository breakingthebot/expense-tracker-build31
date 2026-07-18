// src/screens/AddScreen.tsx
// "Add" tab screen: renders the AddExpenseForm inside a ScrollView,
// and lists active recurring expense schedules. Features a "Manage Categories"
// button and modal allowing the user to create, rename, or delete custom
// categories using a gorgeous 12-color swatch, as well as set and edit monthly
// budget limits per category.
// Connects to: src/components/AddExpenseForm.tsx, src/hooks/useExpenses.ts,
// src/utils/currency.ts, src/services/budgetStorage.ts
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
import { useExpenses } from '../hooks/useExpenses';
import { TabParamList } from '../types/navigation';
import { formatCents, parseDollarsToCents, centsToInputString } from '../utils/currency';

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

export default function AddScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TabParamList, 'Add'>>();
  const {
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
  } = useExpenses();

  const editingExpense = route.params?.editingExpense;

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
      });
      navigation.setParams({ editingExpense: undefined });
      navigation.navigate('History');
    } else if (input.isRecurring && input.interval) {
      await addNewRecurringExpense({
        amountCents: input.amountCents,
        category: input.category,
        note: input.note,
        interval: input.interval,
        startDate: input.date,
      });
      navigation.navigate('History');
    } else {
      await addNewExpense({
        amountCents: input.amountCents,
        category: input.category,
        note: input.note,
        date: input.date,
      });
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <AddExpenseForm
          key={editingExpense?.id ?? 'new'}
          onSubmit={handleFormSubmit}
          submitting={submitting}
          categories={categories}
          editingExpense={editingExpense}
          onCancelEdit={handleCancelEdit}
        />

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
                  placeholderTextColor="#999"
                  accessibilityLabel="New category name"
                />
                <TouchableOpacity
                  style={[styles.modalAddButton, !newCatName.trim() && styles.modalAddButtonDisabled]}
                  onPress={handleCreateCategory}
                  disabled={!newCatName.trim()}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalAddButtonText}>＋ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Color Swatch Picker */}
              <View style={styles.colorSwatchRow}>
                {PALETTE_COLORS.map((color) => {
                  const isSelected = newCatColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        isSelected && styles.colorCircleSelected,
                      ]}
                      onPress={() => setNewCatColor(color)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    />
                  );
                })}
              </View>
            </View>

            {catError && <Text style={styles.modalError}>{catError}</Text>}

            {/* Categories & Budgets Scrolling List */}
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {categories.map((cat) => {
                const isEditingThis = editingCatId === cat.id;
                const isConfirmingDelete = confirmDeleteId === cat.id;
                const isEditingBudget = editingBudgetCatName === cat.name;
                const currentBudget = budgetGoals[cat.name] ?? 0;

                return (
                  <View key={cat.id} style={styles.modalListItem}>
                    <View style={styles.itemMainRow}>
                      <View style={[styles.bulletCircle, { backgroundColor: cat.color }]} />

                      {isEditingThis ? (
                        <View style={styles.modalEditContainer}>
                          <TextInput
                            style={styles.modalEditInput}
                            value={editingCatName}
                            onChangeText={setEditingCatName}
                            autoFocus
                            accessibilityLabel="Edit category name"
                          />
                          <TouchableOpacity
                            style={styles.modalSaveButton}
                            onPress={() => handleSaveRename(cat.id)}
                            accessibilityRole="button"
                          >
                            <Text style={styles.modalSaveButtonText}>✓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => {
                              setEditingCatId(null);
                              setEditingCatName('');
                            }}
                            accessibilityRole="button"
                          >
                            <Text style={styles.modalCancelButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.modalItemText}>{cat.name}</Text>
                          {cat.isSystem ? (
                            <Text style={styles.systemTag}>System</Text>
                          ) : (
                            <View style={styles.modalItemActions}>
                              <TouchableOpacity
                                style={styles.modalItemEdit}
                                onPress={() => {
                                  setEditingCatId(cat.id);
                                  setEditingCatName(cat.name);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`Rename category ${cat.name}`}
                              >
                                <Text style={styles.modalItemEditText}>✎</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.modalItemDelete,
                                  isConfirmingDelete && styles.modalItemDeleteConfirm,
                                ]}
                                onPress={() => handleDeleteCategory(cat.id)}
                                accessibilityRole="button"
                                accessibilityLabel={`Delete category ${cat.name}`}
                              >
                                <Text
                                  style={[
                                    styles.modalItemDeleteText,
                                    isConfirmingDelete && styles.modalItemDeleteTextConfirm,
                                  ]}
                                >
                                  {isConfirmingDelete ? 'Confirm?' : '✕'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </>
                      )}
                    </View>

                    {/* Inline Budget Setter Row */}
                    {!isEditingThis && (
                      <View style={styles.budgetRow}>
                        {isEditingBudget ? (
                          <View style={styles.budgetEditInline}>
                            <TextInput
                              style={styles.budgetInput}
                              value={editingBudgetText}
                              onChangeText={setEditingBudgetText}
                              placeholder="0.00 limit"
                              placeholderTextColor="#999"
                              keyboardType="decimal-pad"
                              autoFocus
                              accessibilityLabel={`Limit for ${cat.name}`}
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
                              onPress={() => {
                                setEditingBudgetCatName(null);
                                setEditingBudgetText('');
                              }}
                              accessibilityRole="button"
                            >
                              <Text style={styles.budgetCancelButtonText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ) : currentBudget > 0 ? (
                          <View style={styles.budgetDisplayRow}>
                            <Text style={styles.budgetDisplayText}>
                              Budget Limit: <Text style={styles.budgetValue}>{formatCents(currentBudget)}</Text>/mo
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                setEditingBudgetCatName(cat.name);
                                setEditingBudgetText(centsToInputString(currentBudget));
                              }}
                              accessibilityRole="button"
                            >
                              <Text style={styles.budgetActionEdit}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => updateBudgetGoal(cat.name, 0)}
                              accessibilityRole="button"
                            >
                              <Text style={styles.budgetActionClear}>Remove</Text>
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
                            <Text style={styles.setBudgetLink}>＋ Set Monthly Budget Goal</Text>
                          </TouchableOpacity>
                        )}
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
              <Text style={styles.modalCloseButtonText}>Close Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  configSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configButton: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  configButtonText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  recurringSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  scheduleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleNote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scheduleSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  scheduleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  // Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  modalAddCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
    marginBottom: 12,
  },
  modalAddRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalAddInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
  },
  modalAddButton: {
    backgroundColor: '#2f6feb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  modalAddButtonDisabled: {
    opacity: 0.5,
  },
  modalAddButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  colorSwatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#333',
    transform: [{ scale: 1.15 }],
  },
  modalError: {
    color: '#c0392b',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalList: {
    flex: 1,
    minHeight: 180,
  },
  modalListContent: {
    paddingBottom: 8,
  },
  modalListItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  modalItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  systemTag: {
    fontSize: 11,
    color: '#888',
    backgroundColor: '#eee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalItemEdit: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemEditText: {
    fontSize: 12,
    color: '#666',
  },
  modalItemDelete: {
    minWidth: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemDeleteConfirm: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  modalItemDeleteText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  modalItemDeleteTextConfirm: {
    color: '#fff',
  },
  modalEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalEditInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2f6feb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  modalSaveButton: {
    width: 28,
    height: 28,
    backgroundColor: '#1baf7a',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalCancelButton: {
    width: 28,
    height: 28,
    backgroundColor: '#666',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  modalCloseButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Budget Swatch Styles
  budgetRow: {
    paddingLeft: 24,
    marginTop: 6,
  },
  setBudgetLink: {
    fontSize: 11,
    color: '#2f6feb',
    fontWeight: '600',
  },
  budgetDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetDisplayText: {
    fontSize: 11,
    color: '#666',
  },
  budgetValue: {
    fontWeight: '700',
    color: '#444',
  },
  budgetActionEdit: {
    fontSize: 11,
    color: '#2f6feb',
    textDecorationLine: 'underline',
  },
  budgetActionClear: {
    fontSize: 11,
    color: '#ef4444',
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
    borderColor: '#2f6feb',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    backgroundColor: '#fff',
    color: '#333',
  },
  budgetSaveButton: {
    backgroundColor: '#1baf7a',
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
    backgroundColor: '#666',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  budgetCancelButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
