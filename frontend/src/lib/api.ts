/**
 * MedLens API Client Configuration
 * Dynamically resolves API root based on environment:
 * - Production / Cloud / Vercel: '/api' (reverse proxy / serverless)
 * - Local Development: 'http://localhost:8000/api'
 */

export const API_BASE = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' 
    ? '/api' 
    : 'http://localhost:8000/api');