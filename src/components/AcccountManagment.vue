<template>
  <div class="account-management">
    <div class="container">
      <div class="header">
        <h1>Учетные записи</h1>
        <button class="add-button" @click="addAccount">+</button>
      </div>
      <div class="hint">
        <span class="hint-icon">?</span>
        Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;
      </div>
      <div class="table-header">
        <div class="col-tags">Метки</div>
        <div class="col-type">Тип записи</div>
        <div class="col-login">Логин</div>
        <div class="col-password">Пароль</div>
        <div class="col-actions"></div>
      </div>
      <div v-if="accountStore.accounts.length === 0" class="empty-state">
        <p>Нет созданных учетных записей</p>
        <p>Нажмите кнопку "+" для создания новой</p>
      </div>
      <div v-for="(account, index) in accountStore.accounts" :key="account.id" class="table-row">
        <div class="col-tags">
          <input 
            v-model="account.tags" 
            @blur="validateAndSave(account)"
            :placeholder="getTagsPlaceholder(account)"
            maxlength="50"
            class="input-field"
          >
        </div>
        <div class="col-type">
          <select 
            v-model="account.type" 
            @change="onTypeChange(account)"
            :class="['select-field', { error: !account.type && account.validated }]"
          >
            <option value="">Выберите тип</option>
            <option value="Локальная">Локальная</option>
            <option value="LDAP">LDAP</option>
          </select>
        </div>
        <div class="col-login">
          <input 
            v-model="account.login" 
            @blur="validateAndSave(account)"
            placeholder="Значение"
            maxlength="100"
            :class="['input-field', { error: !account.login && account.validated }]"
          >
        </div>
        <div class="col-password">
          <div v-if="account.type === 'Локальная'" class="password-container">
            <input 
              v-model="account.password" 
              :type="account.showPassword ? 'text' : 'password'"
              @blur="validateAndSave(account)"
              placeholder="Значение"
              maxlength="100"
              :class="['input-field password-input', { error: account.type === 'Локальная' && !account.password && account.validated }]"
            >
            <button 
              type="button" 
              class="password-toggle"
              @click="togglePasswordVisibility(account)"
            >
              <span v-if="account.showPassword">o</span>
              <span v-else>x</span>
            </button>
          </div>
          <div v-else class="password-disabled">
          </div>
        </div>
        <div class="col-actions">
          <button class="delete-button" @click="deleteAccount(index)">
            X
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAccountStore } from '@stores/accountStore'

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

onMounted(() => {
  accountStore.loadFromStorage()
})

const addAccount = (): void => {
  accountStore.addAccount()
}

const deleteAccount = (index: number): void => {
  accountStore.deleteAccount(index)
}

const onTypeChange = (account: Account): void => {
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
  
  if (validateAccount(account)) {
    accountStore.updateAccount(account)
  }
}
</script>

<style scoped>
.account-management {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f0f0f0;
  padding: 20px;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: #e8e8e8;
  border-radius: 8px;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.add-button {
  background: #ddd;
  border: 1px solid #bbb;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.add-button:hover {
  background: #ccc;
}

.hint {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.hint-icon {
  width: 18px;
  height: 18px;
  background: #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  flex-shrink: 0;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 150px 1fr 1fr 40px;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
  margin-bottom: 10px;
}

.table-header > div {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 150px 1fr 1fr 40px;
  gap: 15px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}

.table-row:last-child {
  border-bottom: none;
}

.input-field,
.select-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s;
}

.input-field:focus,
.select-field:focus {
  outline: none;
  border-color: #007acc;
}

.input-field.error,
.select-field.error {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

.password-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: 40px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-disabled {
  height: 36px;
}

.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button:hover {
  background: #f0f0f0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  grid-column: 1 / -1;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .table-header > div {
    display: none;
  }
  
  .table-row > div {
    position: relative;
  }
  
  .table-row > div::before {
    content: attr(data-label);
    font-weight: 600;
    color: #666;
    font-size: 12px;
    display: block;
    margin-bottom: 4px;
  }
  
  .col-tags::before { content: "Метки:"; }
  .col-type::before { content: "Тип записи:"; }
  .col-login::before { content: "Логин:"; }
  .col-password::before { content: "Пароль:"; }
  .col-actions::before { content: ""; }
}
</style>