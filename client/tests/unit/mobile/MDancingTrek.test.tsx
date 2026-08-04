import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '../../helpers/render';
import MDancingTrek, { type TrekScene } from '../../../src/mobile/components/MDancingTrek';

// FE-MOB-TREKM-001 onwards

const svgOf = (container: HTMLElement) => container.querySelector('svg') as SVGSVGElement;

describe('MDancingTrek', () => {
  it('FE-MOB-TREKM-001: the idle mascot keeps its aspect ratio and open eyes', () => {
    const { container } = render(<MDancingTrek size={88} className="mb-2" />);
    const svg = svgOf(container);

    expect(svg).toHaveAttribute('width', '88');
    expect(svg).toHaveAttribute('height', '96');
    expect(svg.getAttribute('class')).toContain('trek--idle');
    expect(svg.getAttribute('class')).toContain('mb-2');
    expect(container.querySelectorAll('.trek-eye')).toHaveLength(2);
    expect(container.querySelector('.trek-pupils')).toBeInTheDocument();
  });

  it('FE-MOB-TREKM-002: the ground shadow drops for the skateboard scene', () => {
    const { container } = render(<MDancingTrek scene="transport" />);
    expect(container.querySelector('.trek-shadow')).toHaveAttribute('cy', '86');

    const { container: idle } = render(<MDancingTrek />);
    expect(idle.querySelector('.trek-shadow')).toHaveAttribute('cy', '73');
  });

  it.each([
    ['happy', 2, 0],
    ['sleepy', 2, 0],
    ['error', 2, 0],
  ] as const)('FE-MOB-TREKM-003: the %s mood swaps the eyes for drawn strokes', (mood, paths, eyes) => {
    const { container } = render(<MDancingTrek mood={mood} />);

    expect(container.querySelectorAll('.trek-body g[stroke] path')).toHaveLength(paths);
    expect(container.querySelectorAll('.trek-eye')).toHaveLength(eyes);
  });

  it('FE-MOB-TREKM-004: the confused mood keeps one open eye', () => {
    const { container } = render(<MDancingTrek mood="confused" />);

    expect(container.querySelectorAll('.trek-eye')).toHaveLength(1);
    expect(container.querySelector('.trek-pupils')).toBeNull();
  });

  it('FE-MOB-TREKM-005: a scene carries its own default mood', () => {
    const { container: sleepy } = render(<MDancingTrek scene="notifications" />);
    // sleepy = two drawn arcs, no open eyes
    expect(sleepy.querySelectorAll('.trek-eye')).toHaveLength(0);

    const { container: confused } = render(<MDancingTrek scene="search" />);
    expect(confused.querySelectorAll('.trek-eye')).toHaveLength(1);
  });

  it('FE-MOB-TREKM-006: an explicit mood beats the scene default', () => {
    const { container } = render(<MDancingTrek scene="notifications" mood="default" />);

    expect(container.querySelectorAll('.trek-eye')).toHaveLength(2);
  });

  it.each([
    ['transport', '.trek-board'],
    ['guide', '.trek-guide'],
    ['packing', '.trek-suitcase'],
    ['polls', '.trek-polls'],
    ['collections', '.trek-pin'],
    ['atlas', '.trek-globe-wrap'],
    ['costs', '.trek-coins'],
    ['chat', '.trek-chat'],
    ['bookings', '.trek-ticket'],
    ['files', '.trek-ticket'],
    ['notes', '.trek-note'],
    ['journey', '.trek-journal'],
    ['dashboard', '.trek-plane'],
    ['notifications', '.trek-zzz'],
    ['search', '.trek-magnifier'],
    ['tasks', '.trek-tasks'],
  ] as Array<[TrekScene, string]>)('FE-MOB-TREKM-007: the %s scene brings its own prop', (scene, selector) => {
    const { container } = render(<MDancingTrek scene={scene} />);

    expect(container.querySelector(selector)).toBeInTheDocument();
    expect(container.querySelector(`.trek-bounce--${scene}`)).toBeInTheDocument();
  });

  it('FE-MOB-TREKM-008: the idle scene has no prop at all', () => {
    const { container } = render(<MDancingTrek scene="idle" />);

    expect(container.querySelector('.trek-root')?.children).toHaveLength(1);
  });

  it('FE-MOB-TREKM-009: poking the mascot remounts the svg to replay the pop-in', () => {
    const { container } = render(<MDancingTrek />);
    const before = svgOf(container);

    fireEvent.click(before);

    expect(svgOf(container)).not.toBe(before);
  });
});
