/**
 * Pure world ↔ screen coordinate transforms for a ScreenPose viewport.
 */

import type { ScreenPose } from './types';

export interface WorldPoint {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface WorldRegionSlice {
  worldX: number;
  worldY: number;
  worldWidth: number;
  worldHeight: number;
  /** Screen pixels per world unit along X (pose.worldWidth maps to viewport width 1). */
  scaleX: number;
  scaleY: number;
}

export type { ScreenPose };

/** The world-region this pose renders (its bbox). */
export function sliceWorldRegion(pose: ScreenPose): WorldRegionSlice {
  return {
    worldX: pose.worldX,
    worldY: pose.worldY,
    worldWidth: pose.worldWidth,
    worldHeight: pose.worldHeight,
    scaleX: pose.worldWidth > 0 ? 1 / pose.worldWidth : 0,
    scaleY: pose.worldHeight > 0 ? 1 / pose.worldHeight : 0,
  };
}

/** Map a world point into normalized screen space (0..1 within pose bbox). */
export function worldToScreen(point: WorldPoint, pose: ScreenPose): ScreenPoint {
  return {
    x: pose.worldWidth > 0 ? (point.x - pose.worldX) / pose.worldWidth : 0,
    y: pose.worldHeight > 0 ? (point.y - pose.worldY) / pose.worldHeight : 0,
  };
}

/** Inverse of worldToScreen for points inside the pose bbox. */
export function screenToWorld(point: ScreenPoint, pose: ScreenPose): WorldPoint {
  return {
    x: pose.worldX + point.x * pose.worldWidth,
    y: pose.worldY + point.y * pose.worldHeight,
  };
}
