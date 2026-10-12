import { phosphorBarbellFill, phosphorChartBarFill, phosphorForkKnifeFill, phosphorHeartbeatFill, phosphorUserCircleFill } from '@ng-icons/phosphor-icons/fill';
import { phosphorBarbell, phosphorChartBar, phosphorForkKnife, phosphorHeartbeat, phosphorUserCircle } from '@ng-icons/phosphor-icons/regular';

/** How a section is presented in the main navigation. Its label comes from the route title. */
export interface HomeDestinationPresentation {
  /** Path of the child route of the shell. */
  path: string;
  /** Icon shown while the destination is not active (outline weight). */
  icon: string;
  /** Icon shown while the destination is active (fill weight). */
  activeIcon: string;
  /** Label shown instead of the route title, when the title is too long for the bar. */
  shortLabel?: string;
}

/** The five destinations of the main navigation, in order. */
export const HOME_DESTINATIONS: readonly HomeDestinationPresentation[] = [
  { path: 'salud', icon: 'phosphorHeartbeat', activeIcon: 'phosphorHeartbeatFill' },
  { path: 'nutricion', icon: 'phosphorForkKnife', activeIcon: 'phosphorForkKnifeFill' },
  {
    path: 'entrenamiento',
    icon: 'phosphorBarbell',
    activeIcon: 'phosphorBarbellFill',
    shortLabel: 'Entreno',
  },
  { path: 'progreso', icon: 'phosphorChartBar', activeIcon: 'phosphorChartBarFill' },
  { path: 'perfil', icon: 'phosphorUserCircle', activeIcon: 'phosphorUserCircleFill' },
];

/** The ten icons of the navigation, registered in the shell's own providers. */
export const HOME_ICONS = {
  phosphorHeartbeat,
  phosphorHeartbeatFill,
  phosphorForkKnife,
  phosphorForkKnifeFill,
  phosphorBarbell,
  phosphorBarbellFill,
  phosphorChartBar,
  phosphorChartBarFill,
  phosphorUserCircle,
  phosphorUserCircleFill,
};
