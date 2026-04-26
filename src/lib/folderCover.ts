import type { CSSProperties } from 'react';
import type { FolderMoodKey, Link } from '../types';

type LinkStage = Link['status'];
type TextTone = 'light' | 'dark';

interface MoodPalette {
  base: [string, string, string];
  insightTint: string;
  expandedTint: string;
}

interface StageDistribution {
  saved: number;
  insight: number;
  expanded: number;
}

export interface FolderCoverResult {
  style: CSSProperties;
  previewImage?: string;
  isEmpty: boolean;
  hasImage: boolean;
  textTone: TextTone;
}

const FOLDER_MOOD_PALETTES: Record<FolderMoodKey, MoodPalette> = {
  default: {
    base: ['#FCFCFF', '#EEF2FF', '#DDE7FF'],
    insightTint: '#C9C2FF',
    expandedTint: '#8FA4FF',
  },
  research: {
    base: ['#FFFDF5', '#F4F1E8', '#DFE8F4'],
    insightTint: '#D7DDF8',
    expandedTint: '#AFC3E8',
  },
  branding: {
    base: ['#FFF4EE', '#F9E8F2', '#EADFFF'],
    insightTint: '#D8C4FF',
    expandedTint: '#F2AFCF',
  },
  space: {
    base: ['#F6F5EF', '#E7EFE7', '#DCE4DE'],
    insightTint: '#C7D8CC',
    expandedTint: '#9FB8A8',
  },
  product: {
    base: ['#F4FAFF', '#E6F0FF', '#D9E4FF'],
    insightTint: '#C8D4FF',
    expandedTint: '#93ABF5',
  },
  life: {
    base: ['#FFF8E8', '#FCEFE6', '#F7E6EF'],
    insightTint: '#F2D7E8',
    expandedTint: '#F4C38D',
  },
};

const EMPTY_BASE: [string, string, string] = ['#FFFFFF', '#FBFCFF', '#F2F5FF'];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const value = parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pickPreviewImage(links: Link[]) {
  const previewLink = links.find((link) => link.images?.[0] || link.ogImage);
  return previewLink?.images?.[0] || previewLink?.ogImage;
}

function getStageDistribution(links: Link[]): StageDistribution {
  if (links.length === 0) {
    return { saved: 0, insight: 0, expanded: 0 };
  }

  const totals = links.reduce(
    (acc, link) => {
      acc[link.status] += 1;
      return acc;
    },
    { saved: 0, insight: 0, expanded: 0 } as Record<LinkStage, number>
  );

  return {
    saved: totals.saved / links.length,
    insight: totals.insight / links.length,
    expanded: totals.expanded / links.length,
  };
}

export function buildFolderCover(
  moodKey: FolderMoodKey | undefined,
  links: Link[]
): FolderCoverResult {
  const resolvedMood = moodKey ?? 'default';
  const palette = FOLDER_MOOD_PALETTES[resolvedMood];
  const previewImage = pickPreviewImage(links);
  const distribution = getStageDistribution(links);
  const isEmpty = links.length === 0;
  const hasImage = Boolean(previewImage);

  const base = isEmpty ? EMPTY_BASE : palette.base;
  const insightAlpha = clamp(distribution.insight * 0.22, 0, 0.2);
  const expandedAlpha = clamp(distribution.expanded * 0.3, 0, 0.28);
  const motionSeconds = 10 - clamp(distribution.expanded * 3 + distribution.insight * 2, 0, 4);

  const baseGradient = `linear-gradient(135deg, ${base.join(', ')})`;
  const insightLayer = `radial-gradient(circle at 22% 24%, ${withAlpha(palette.insightTint, insightAlpha)} 0%, rgba(255, 255, 255, 0) 58%)`;
  const expandedLayer = `radial-gradient(circle at 78% 18%, ${withAlpha(palette.expandedTint, expandedAlpha)} 0%, rgba(255, 255, 255, 0) 62%)`;
  const imageLayer = hasImage
    ? `linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%), url(${previewImage})`
    : null;

  const backgroundImage = [expandedLayer, insightLayer, baseGradient, imageLayer]
    .filter(Boolean)
    .join(', ');

  return {
    previewImage,
    isEmpty,
    hasImage,
    textTone: isEmpty ? 'dark' : hasImage || distribution.expanded > 0.35 ? 'light' : 'dark',
    style: {
      backgroundColor: base[0],
      backgroundImage,
      backgroundSize: hasImage
        ? '140% 140%, 130% 130%, 100% 100%, cover'
        : '140% 140%, 130% 130%, 100% 100%',
      backgroundPosition: hasImage
        ? '0% 0%, 100% 0%, center, center'
        : '0% 0%, 100% 0%, center',
      animationDuration: `${motionSeconds}s`,
    },
  };
}

