<template>
  <div class="account-management dark-theme">
    <div class="container">
      <div class="header">
        <h1>Учетные записи</h1>
        <el-button 
          type="primary" 
          :icon="Plus" 
          circle
          @click="addAccount"
          class="add-button"
        />
      </div>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="hint-alert"
      >
        <template #title>
          Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;
        </template>
      </el-alert>
      <div class="table-header grid-table" :class="{ 'no-password': !hasPasswordFields }">
        <div class="col-tags">Метки</div>
        <div class="col-type">Тип записи</div>
        <div class="col-login">Логин</div>
        <div v-if="hasPasswordFields" class="col-password">Пароль</div>
        <div class="col-actions"></div>
      </div>
      <div v-if="accountStore.accounts.length === 0" class="empty-state">
        <p>Нет созданных учетных записей</p>
        <p>Нажмите кнопку "+" для создания новой</p>
      </div>
      <div v-for="(account, index) in accountStore.accounts" :key="account.id" 
           class="table-row grid-table" :class="{ 'no-password': account.type === 'LDAP' || !hasPasswordFields }">
        <!-- Метки -->
        <div class="col-tags">
          <el-input
            v-model="account.tags"
            :placeholder="getTagsPlaceholder(account)"
            maxlength="50"
            @blur="validateAndSave(account)"
            clearable
            class="input-field"
          />
        </div>
        <div class="col-type">
          <el-select
            v-model="account.type"
            placeholder="Выберите тип"
            @change="onTypeChange(account)"
            class="select-field"
            :class="{ 'error-field': !account.type && account.validated }"
          >
            <el-option label="Локальная" value="Локальная" />
            <el-option label="LDAP" value="LDAP" />
          </el-select>
        </div>
        <div class="col-login">
          <el-input
            v-model="account.login"
            placeholder="Значение"
            maxlength="100"
            @blur="validateAndSave(account)"
            clearable
            :prefix-icon="User"
            class="input-field"
            :class="{ 'error-field': !account.login && account.validated }"
          />
        </div>
        <div v-if="account.type === 'Локальная'" class="col-password">
          <el-input
            v-model="account.password"
            :type="account.showPassword ? 'text' : 'password'"
            placeholder="Значение"
            maxlength="100"
            @blur="validateAndSave(account)"
            clearable
            :prefix-icon="Lock"
            class="input-field password-input"
            :class="{ 'error-field': account.type === 'Локальная' && !account.password && account.validated }"
          >
            <template #suffix>
              <el-icon 
                class="password-toggle" 
                @click="togglePasswordVisibility(account)"
              >
                <View v-if="account.showPassword" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </div>
        <div class="col-actions">
          <el-popconfirm
            title="Удалить эту запись?"
            confirm-button-text="Да"
            cancel-button-text="Нет"
            @confirm="deleteAccount(index)"
            popper-class="dark-popconfirm"
          >
            <template #reference>
              <el-button 
                type="danger" 
                :icon="Delete" 
                circle 
                size="small"
                class="delete-button"
              />
            </template>
          </el-popconfirm>
        </div>
      </div>
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <el-alert
          v-for="(error, index) in validationErrors"
          :key="index"
          :title="error"
          type="error"
          :closable="false"
          show-icon
          class="error-alert"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useAccountStore } from '@stores/accountStore'
import { 
  Plus, 
  Delete, 
  User, 
  Lock, 
  View, 
  Hide
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import '@/assets/theme-variables.css'

interface Tag {
  text: string
}

interface Account {
  id: number
  tags: string
  parsedTags: Tag[]
  type: '' | 'LDAP' | 'Локальная'
  login: string
  password: string | null
  validated: boolean
  showPassword?: boolean
}

const accountStore = useAccountStore()
const validationErrors = ref<string[]>([])

const hasPasswordFields = computed(() => {
  return accountStore.accounts.some(account => account.type === 'Локальная')
})

onMounted(() => {
  accountStore.loadFromStorage()
})

const addAccount = (): void => {
  accountStore.addAccount()
  ElMessage.success('Добавлена новая запись')
}

const deleteAccount = (index: number): void => {
  accountStore.deleteAccount(index)
  ElMessage.success('Запись удалена')
}

const onTypeChange = (account: Account): void => {
  if (account.type === 'LDAP') {
    account.password = null
  }
  validateAndSave(account)
}

const togglePasswordVisibility = (account: Account): void => {
  account.showPassword = !account.showPassword
}

const getTagsPlaceholder = (account: Account): string => {
  if (account.tags) {
    return account.tags
  }
  return account.type === 'LDAP' ? 'Значение' : 'XXX'
}

const validateAccount = (account: Account): boolean => {
  const isValid = account.login && account.type && 
    (account.type === 'LDAP' || (account.type === 'Локальная' && account.password))
  return isValid
}

const validateAndSave = (account: Account): void => {
  account.validated = true
  validationErrors.value = []
  
  if (!account.login) {
    validationErrors.value.push('Поле "Логин" обязательно для заполнения')
  }
  
  if (!account.type) {
    validationErrors.value.push('Поле "Тип записи" обязательно для заполнения')
  }
  
  if (account.type === 'Локальная' && !account.password) {
    validationErrors.value.push('Поле "Пароль" обязательно для локальных записей')
  }
  
  if (validateAccount(account)) {
    accountStore.updateAccount(account)
    if (validationErrors.value.length === 0) {
      ElMessage.success('Запись сохранена')
    }
  } else {
    ElMessage.error('Заполните все обязательные поля')
  }
}
</script>
<style scoped>
.account-management {
  font-family: var(--font-family);
  background-color: var(--bg-secondary);
  padding: var(--spacing-xl);
  min-height: 100vh;
  color: var(--text-primary);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-primary);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.header h1 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.table-header {
  padding: var(--spacing-md) 0;
  border-bottom: 2px solid var(--border-secondary);
  margin-bottom: var(--spacing-md);
}

.table-header > div {
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  font-size: var(--font-size-base);
}

.table-row {
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-primary);
}

.table-row:last-child {
  border-bottom: none;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-xl);
  color: var(--text-tertiary);
  grid-column: 1 / -1;
}

.empty-state p {
  font-size: var(--font-size-base);
  margin-bottom: var(--spacing-sm);
}

.password-toggle {
  cursor: pointer;
  transition: color var(--transition-normal);
  color: var(--text-tertiary);
}

.password-toggle:hover {
  color: var(--text-primary);
}

.validation-errors {
  margin-top: var(--spacing-xl);
}

.error-alert {
  margin-bottom: var(--spacing-md);
}

.error-alert:last-child {
  margin-bottom: 0;
}

:deep(.el-button.add-button) {
  background: var(--border-primary);
  border: 1px solid var(--border-tertiary);
  color: var(--text-primary);
  width: var(--button-size-small);
  height: var(--button-size-small);
  padding: 0;
  transition: all var(--transition-fast);
}

:deep(.el-button.add-button:hover) {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

:deep(.el-button.add-button:active) {
  background: var(--bg-active);
  border-color: var(--border-secondary);
}

:deep(.el-button.delete-button) {
  background: var(--border-primary);
  border: 1px solid var(--border-tertiary);
  color: var(--text-tertiary);
  width: var(--button-size-small);
  height: var(--button-size-small);
  padding: 0;
  transition: all var(--transition-fast);
}

:deep(.el-button.delete-button:hover) {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--color-error-light);
}

:deep(.el-button.delete-button:active) {
  background: var(--bg-active);
  border-color: var(--border-secondary);
}

:deep(.el-alert.hint-alert) {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-xl);
}

:deep(.el-alert.hint-alert .el-alert__title) {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
}

:deep(.el-alert.hint-alert .el-alert__icon) {
  color: var(--text-disabled);
}

:deep(.el-input__wrapper) {
  background-color: var(--bg-input);
  border: 1px solid var(--border-secondary);
  box-shadow: none;
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--border-tertiary);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus);
}

:deep(.el-input__inner) {
  color: var(--text-primary);
  background-color: transparent;
  font-size: var(--font-size-base);
}

:deep(.el-input__inner::placeholder) {
  color: var(--text-muted);
}

:deep(.error-field .el-input__wrapper) {
  border-color: var(--color-error);
  background-color: var(--color-error-bg);
}

:deep(.el-input__prefix-inner),
:deep(.el-input__suffix-inner) {
  color: var(--text-disabled);
}

:deep(.el-select__wrapper) {
  background-color: var(--bg-input);
  border: 1px solid var(--border-secondary);
  box-shadow: none;
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
}

:deep(.el-select .el-input__wrapper) {
  background-color: var(--bg-input);
  border: 1px solid var(--border-secondary);
}

:deep(.el-select .el-input__wrapper:hover) {
  border-color: var(--border-tertiary);
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: var(--border-focus);
}

:deep(.error-field .el-select .el-input__wrapper) {
  border-color: var(--color-error);
  background-color: var(--color-error-bg);
}

:deep(.el-input__suffix-inner .el-select__caret) {
  color: var(--text-disabled);
}

:deep(.el-alert.error-alert) {
  background-color: var(--color-error-bg);
  border: 1px solid var(--color-error);
}

:deep(.el-alert.error-alert .el-alert__title) {
  color: var(--color-error-light);
}

:deep(.el-alert.error-alert .el-alert__icon) {
  color: var(--color-error);
}

:global(.el-select-dropdown) {
  background-color: var(--bg-input) !important;
  border: 1px solid var(--border-secondary) !important;
  box-shadow: var(--shadow-dropdown) !important;
}

:global(.el-select-dropdown .el-select-dropdown__item) {
  color: var(--text-primary) !important;
  background-color: transparent !important;
}

:global(.el-select-dropdown .el-select-dropdown__item:hover) {
  background-color: var(--bg-hover) !important;
}

:global(.el-select-dropdown .el-select-dropdown__item.selected) {
  background-color: var(--border-focus) !important;
  color: var(--text-primary) !important;
}

:global(.dark-popconfirm) {
  background-color: var(--bg-input) !important;
  border: 1px solid var(--border-secondary) !important;
  color: var(--text-primary) !important;
}

:global(.dark-popconfirm .el-popconfirm__main) {
  color: var(--text-primary) !important;
}

:global(.dark-popconfirm .el-button--primary) {
  background-color: var(--border-focus) !important;
  border-color: var(--border-focus) !important;
}

:global(.dark-popconfirm .el-button--default) {
  background-color: var(--bg-hover) !important;
  border-color: var(--border-tertiary) !important;
  color: var(--text-primary) !important;
}

:global(.el-message) {
  background-color: var(--bg-input) !important;
  border: 1px solid var(--border-secondary) !important;
  color: var(--text-primary) !important;
}

:global(.el-message.el-message--success) {
  background-color: var(--color-success-bg) !important;
  border-color: var(--color-success) !important;
}

:global(.el-message.el-message--error) {
  background-color: var(--color-error-bg) !important;
  border-color: var(--color-error) !important;
}

@media (max-width: 768px) {
  .table-header > div {
    display: none;
  }
  
  .table-row > div {
    position: relative;
  }
  
  .table-row > div::before {
    content: attr(data-label);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    display: block;
    margin-bottom: var(--spacing-xs);
  }
  
  .col-tags::before { content: "Метки:"; }
  .col-type::before { content: "Тип записи:"; }
  .col-login::before { content: "Логин:"; }
  .col-password::before { content: "Пароль:"; }
  .col-actions::before { content: ""; }
}
</style>