<template>
  <v-btn 
    v-if="variant === 'icon'"
    icon="mdi-folder-plus-outline"
    @click="handleOpen"
    size="small"
    class="action-btn"
    color="transparent"
  />

  <v-list-item-title
    v-else
    @click="handleOpen"
    class="d-flex align-center cursor-pointer hover-bg pa-2 rounded"
  >
    <v-icon size="small" class="mr-2">mdi-folder-plus-outline</v-icon>
    Add Item
  </v-list-item-title>


  <v-dialog
    v-model="dialog"
    max-width="400px"
    persistent
    @click:outside="handleClose"
  >
    <v-card class="creator-dialog">
      <v-card-title class="d-flex justify-space-between align-center pa-3 bg-dark">
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-2" color="grey-lighten-2">
            {{ getItemIcon }}
          </v-icon>
          <span class="text-subtitle-1 text-grey-lighten-2">Create New {{ newItemType }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="handleClose"
          color="grey-lighten-2"
        />
      </v-card-title>

      <v-card-text class="pa-3 bg-dark">
        <v-select
          v-model="newItemType"
          :items="itemTypes"
          item-title="text"
          item-value="value"
          density="compact"
          class="mb-3"
          variant="outlined"
          theme="dark"
        >
          <template v-slot:prepend-inner>
            <v-icon size="small" color="grey-lighten-2">
              {{ newItemType === 'folder' ? 'mdi-folder-outline' : 'mdi-file-outline' }}
            </v-icon>
          </template>
        </v-select>

        <v-text-field
          v-model="newItemName"
          :label="`${newItemType} Name`"
          :rules="nameRules"
          required
          @keyup.enter="saveChanges"
          density="compact"
          variant="outlined"
          :error-messages="errorMessage"
          theme="dark"
        >
          <template v-slot:prepend-inner>
            <v-icon size="small" color="grey-lighten-2">mdi-form-textbox</v-icon>
          </template>
        </v-text-field>
      </v-card-text>

      <v-card-actions class="pa-3 bg-dark">
        <v-spacer />
        <v-btn
          color="grey"
          variant="text"
          @click="handleClose"
          :disabled="saving"
          class="mr-2"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="saveChanges"
          :loading="saving"
          :disabled="!isValid"
          class="px-6"
        >
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar
    v-model="showError"
    color="error"
    :timeout="5000"
    location="top"
  >
    <div class="d-flex align-center">
      <v-icon size="small" class="mr-2">mdi-alert-circle</v-icon>
      {{ errorMessage }}
    </div>
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="showError = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import axios from 'axios'

export default defineComponent({
  name: 'FileCreatorDialog',
  props: {
    currentPath: {
      type: String,
      required: true
    },
    variant: {
    type: String,
    default: 'icon',
    validator: (value: string) => ['icon', 'text'].includes(value)
  }
  },
  emits: ['item-created'],

  setup(props, { emit }) {
    const dialog = ref(false)
    const newItemName = ref('')
    const newItemType = ref('folder')
    const saving = ref(false)
    const errorMessage = ref('')
    const showError = ref(false)

    const itemTypes = [
      { text: 'Folder', value: 'folder' },
      { text: 'File', value: 'file' }
    ]

    const getItemIcon = computed(() => {
      return newItemType.value === 'folder' 
        ? 'mdi-folder-plus'
        : 'mdi-file-plus'
    })

    const nameRules = [
      (v: string) => !!v || 'Name is required',
      (v: string) => v.trim().length > 0 || 'Name cannot be empty',
      (v: string) => /^[a-zA-Z0-9_\-. ]+$/.test(v) || 'Name contains invalid characters',
      (v: string) => !v.includes('/') || 'Name cannot contain "/"',
      (v: string) => !v.includes('\\') || 'Name cannot contain "\\"'
    ]

    const isValid = computed(() => {
      return newItemName.value.trim() && nameRules.every(rule => rule(newItemName.value) === true)
    })

    const displayError = (message: string) => {
      errorMessage.value = message
      showError.value = true
    }

    const handleOpen = () => {
      dialog.value = true
      newItemName.value = ''
      newItemType.value = 'folder'
    }

    const handleClose = () => {
      dialog.value = false
      newItemName.value = ''
      errorMessage.value = ''
      showError.value = false
    }

    const saveChanges = async () => {
      if (!isValid.value) {
        return
      }

      saving.value = true
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}api/create_item`,
          {
            path: props.currentPath,
            name: newItemName.value.trim(),
            type: newItemType.value,
          }
        )
        
        if (response.data.success) {
          emit('item-created')
          handleClose()
        } else {
          displayError(response.data.message || `Failed to create ${newItemType.value}`)
        }
      } catch (error: any) {
        console.error('Error creating item:', error)
        displayError(error.response?.data?.message || 'Error connecting to the server')
      } finally {
        saving.value = false
      }
    }

    return {
      dialog,
      newItemName,
      newItemType,
      itemTypes,
      saving,
      errorMessage,
      showError,
      getItemIcon,
      nameRules,
      isValid,
      handleOpen,
      handleClose,
      saveChanges
    }
  }
})
</script>

<style scoped>
:deep(.v-text-field .v-field__input) {
  color: #fff !important;
}
:deep(.v-text-field .v-label) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.v-select .v-field--variant-outlined) {
  border-color: rgba(255, 255, 255, 0.1);
}
</style>