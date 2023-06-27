import { createStore, combineReducers } from 'redux'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import inventoryList from '../store/InventoryList/InventoryList.reducer'
import inventoryStates from '../store/InventoryStates/InventoryStates.reducer'
import inventoryDB from '../store/InventoryDB/InventoryDB.reducer'
import fatoresEmissao from '../store/FatoresEmissao/FatoresEmissao.reducer'
import userConfig from '../store/UserConfig/UserConfig.reducer'
import inventoryManagement from '../store/InventoryManagement/InventoryManagement.reducer'
import reportLoading from './ReportLoading/ReportLoading.reducer'
import { unidList, unidSelect } from './UnidSelect/UnidSelect.reducer'
import akvoToolReducer from './AkvoTools/AkvoTools.reducer'

const rootReducer = combineReducers({
    inventoryList: inventoryList,
    inventoryStates: inventoryStates,
    inventoryDB: inventoryDB,
    fatoresEmissao: fatoresEmissao,
    userConfig: userConfig,
    inventoryManagement: inventoryManagement,
    reportLoading: reportLoading,
    unidList: unidList,
    unidSelect: unidSelect,
    tool: akvoToolReducer
})

const persistedReducer = persistReducer({
    key: 'root',
    storage,
    blacklist: ['inventoryStates', 'inventoryDB', 'fatoresEmissao', 'userConfig', 'unidList']
}, rootReducer)

export const store = createStore(persistedReducer)

export const persistedStore = persistStore(store)