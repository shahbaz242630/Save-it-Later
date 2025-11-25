import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Tag } from '@/types';
import { TagChip } from './TagChip';

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: string[];
  onChange: (nextTags: string[]) => void;
  label?: string;
}

const normalize = (value: string) => value.trim().toLowerCase();

export function TagSelector({ availableTags, selectedTags, onChange, label }: TagSelectorProps) {
  const [draftTag, setDraftTag] = useState('');

  const selectedLookup = useMemo(() => {
    return new Set(selectedTags.map((tag) => normalize(tag)));
  }, [selectedTags]);

  const toggleTag = (tagName: string) => {
    const normalized = normalize(tagName);
    if (!normalized) return;
    if (selectedLookup.has(normalized)) {
      onChange(selectedTags.filter((tag) => normalize(tag) !== normalized));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  const addDraftTag = () => {
    const normalizedDraft = draftTag.trim();
    if (!normalizedDraft) return;
    if (!selectedLookup.has(normalize(normalizedDraft))) {
      onChange([...selectedTags, normalizedDraft]);
    }
    setDraftTag('');
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.selectedRow}>
        {selectedTags.length === 0 ? (
          <Text style={styles.placeholder}>No tags selected</Text>
        ) : (
          selectedTags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              selected
              onPress={() => toggleTag(tag)}
              style={styles.selectedChip}
            />
          ))
        )}
      </View>
      <View style={styles.draftRow}>
        <TextInput
          style={styles.input}
          value={draftTag}
          onChangeText={setDraftTag}
          placeholder="Add a new tag"
          placeholderTextColor="#94a3b8"
          onSubmitEditing={addDraftTag}
        />
        <Pressable style={styles.addButton} onPress={addDraftTag}>
          <Text style={styles.addButtonLabel}>Add</Text>
        </Pressable>
      </View>
      <Text style={styles.availableLabel}>Available Tags</Text>
      <View style={styles.availableRow}>
        {availableTags.length ? (
          availableTags.map((tag) => (
            <TagChip
              key={tag.id}
              label={tag.name}
              selected={selectedLookup.has(normalize(tag.name))}
              onPress={() => toggleTag(tag.name)}
            />
          ))
        ) : (
          <Text style={styles.placeholder}>No tags created yet</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  placeholder: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  addButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  availableLabel: {
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  availableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
