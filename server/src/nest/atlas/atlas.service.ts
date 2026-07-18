import { Injectable } from '@nestjs/common';
import {
  getStats,
  getCountryPlaces,
  markCountryVisited,
  unmarkCountryVisited,
  markRegionVisited,
  unmarkRegionVisited,
  getVisitedRegions,
  getRegionGeo,
  getCountryGeoGz,
  listBucketList,
  createBucketItem,
  updateBucketItem,
  deleteBucketItem,
} from '../../services/atlasService';

type CreateBucketData = Parameters<typeof createBucketItem>[1];
type UpdateBucketData = Parameters<typeof updateBucketItem>[2];

/**
 * Thin Nest wrapper around the existing atlas service. The Admin-1 GeoJSON
 * cache, the stats aggregation and the visited-region logic all stay in
 * atlasService, so behaviour is unchanged. Returns native service shapes; the
 * client-facing contracts live in @trek/shared.
 */
@Injectable()
export class AtlasService {
  stats(userId: number) {
    return getStats(userId);
  }

  visitedRegions(userId: number) {
    return getVisitedRegions(userId);
  }

  regionGeo(countries: string[]) {
    return getRegionGeo(countries);
  }

  countryGeoGz(): Buffer | null {
    return getCountryGeoGz();
  }

  countryPlaces(userId: number, code: string) {
    return getCountryPlaces(userId, code);
  }

  markCountry(userId: number, code: string): void {
    markCountryVisited(userId, code);
  }

  unmarkCountry(userId: number, code: string): void {
    unmarkCountryVisited(userId, code);
  }

  markRegion(userId: number, code: string, name: string, countryCode: string): void {
    markRegionVisited(userId, code, name, countryCode);
  }

  unmarkRegion(userId: number, code: string): void {
    unmarkRegionVisited(userId, code);
  }

  bucketList(userId: number) {
    return listBucketList(userId);
  }

  createBucketItem(userId: number, data: CreateBucketData) {
    return createBucketItem(userId, data);
  }

  updateBucketItem(userId: number, itemId: string, data: UpdateBucketData) {
    return updateBucketItem(userId, itemId, data);
  }

  deleteBucketItem(userId: number, itemId: string): boolean {
    return deleteBucketItem(userId, itemId);
  }
}
