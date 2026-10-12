/**
 * Central Services Barrel Export
 * Provides unified access to base HTTP clients, domain feature services, sockets, and managers
 */

export * from './client';
export * from './features';
export * from './api';
export * from './api/clinicApi';
export * from './socket';

export * as managerAnalytics from './managerAnalytics.service';
export * as managerCrm from './managerCrm.service';
