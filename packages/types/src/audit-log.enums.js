"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogTargetTypes = exports.AuditLogActions = void 0;
exports.AuditLogActions = [
    // General CRUD
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    // User & Session Management
    'LOGIN',
    'LOGOUT',
    'SETUP', // Initial user setup
    // Ingestion Actions
    'IMPORT',
    'PAUSE',
    'SYNC',
    'UPLOAD',
    // Other Actions
    'SEARCH',
    'DOWNLOAD',
    'GENERATE', // For API keys
];
exports.AuditLogTargetTypes = [
    'ApiKey',
    'ArchivedEmail',
    'Dashboard',
    'IngestionSource',
    'JournalingSource',
    'RetentionPolicy',
    'RetentionLabel',
    'LegalHold',
    'Role',
    'SystemEvent',
    'SystemSettings',
    'User',
    'File', // For uploads and downloads
];
