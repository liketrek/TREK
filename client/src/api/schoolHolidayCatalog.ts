import { schoolHolidayCatalogSchema, schoolHolidayRegionDetailSchema, type SchoolHolidayCountryRequest, type SchoolHolidayRegionRequest } from '@trek/shared'
import apiClient from './client'

const base = '/school-holiday-catalog'
export const schoolHolidayCatalogApi = {
  catalog: () => apiClient.get(base).then(r => schoolHolidayCatalogSchema.parse(r.data)),
  region: (id: number) => apiClient.get(`${base}/regions/${id}`).then(r => schoolHolidayRegionDetailSchema.parse(r.data)),
  createCountry: (country: SchoolHolidayCountryRequest) => apiClient.post(`${base}/countries`, country),
  deleteCountry: (code: string) => apiClient.delete(`${base}/countries/${code}`),
  createRegion: (country: string, region: SchoolHolidayRegionRequest) => apiClient.post(`${base}/countries/${country}/regions`, region).then(r => schoolHolidayRegionDetailSchema.parse(r.data)),
  updateRegion: (id: number, region: SchoolHolidayRegionRequest) => apiClient.put(`${base}/regions/${id}`, region).then(r => schoolHolidayRegionDetailSchema.parse(r.data)),
  deleteRegion: (id: number, revision: number) => apiClient.delete(`${base}/regions/${id}`, { params: { revision } }),
}
