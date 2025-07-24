import { defineStore } from 'pinia'

export interface Tag {
  text: string
}

export interface Account {
  id: number
  tags: string
  parsedTags: Tag[]
  type: '' | 'LDAP' | 'Локальная'
  login: string
  password: string | null
  validated: boolean
  showPassword?: boolean
}

interface AccountState {
  accounts: Account[]
}

export const useAccountStore = defineStore('accounts', {
  state: (): AccountState => ({
    accounts: []
  }),
  
  actions: {
    loadFromStorage(): void {
      try {
        const stored = localStorage.getItem('accounts')
        if (stored) {
          this.accounts = JSON.parse(stored)
        }
      } catch (error) {
        console.error('Ошибка загрузки данных из localStorage:', error)
        this.accounts = []
      }
    },
    
    saveToStorage(): void {
      try {
        localStorage.setItem('accounts', JSON.stringify(this.accounts))
      } catch (error) {
        console.error('Ошибка сохранения данных в localStorage:', error)
      }
    },
    
    addAccount(): void {
      const newAccount: Account = {
        id: Date.now(),
        tags: '',
        parsedTags: [],
        type: '',
        login: '',
        password: '',
        validated: false,
        showPassword: false
      }
      this.accounts.push(newAccount)
      this.saveToStorage()
    },
    
    deleteAccount(index: number): void {
      if (index >= 0 && index < this.accounts.length) {
        this.accounts.splice(index, 1)
        this.saveToStorage()
      }
    },
    
    updateAccount(account: Account): void {
      if (account.tags) {
        account.parsedTags = account.tags
          .split(';')
          .filter(tag => tag.trim())
          .map(tag => ({ text: tag.trim() }))
      } else {
        account.parsedTags = []
      }
      
      if (account.type === 'LDAP') {
        account.password = null
      }
      
      this.saveToStorage()
    }
  },
  
  getters: {
    accountsCount: (state): number => state.accounts.length,
    
    validAccounts: (state): Account[] => {
      return state.accounts.filter(account => 
        account.login && 
        account.type && 
        (account.type === 'LDAP' || (account.type === 'Локальная' && account.password))
      )
    }
  }
})