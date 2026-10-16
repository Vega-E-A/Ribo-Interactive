// Centralized image asset references for Ribby the Rebel
import ribbyFrontAsset from './images/ribby_rebel_dance_front_1791393508947.jpg';
import ribbyOrbitAsset from './images/ribby_camera_orbit_angle_1791393519291.jpg';
import ribbyCloseupAsset from './images/ribby_closeup_focus_1791393530166.jpg';
import ribbyWideAsset from './images/ribby_wide_club_stage_1791393541142.jpg';

export const RIBBY_IMAGES = {
  front: ribbyFrontAsset || '/images/ribby_rebel_dance_front_1791393508947.jpg',
  orbit: ribbyOrbitAsset || '/images/ribby_camera_orbit_angle_1791393519291.jpg',
  closeup: ribbyCloseupAsset || '/images/ribby_closeup_focus_1791393530166.jpg',
  wide: ribbyWideAsset || '/images/ribby_wide_club_stage_1791393541142.jpg',
};

export const RIBBY_IMAGE_ARRAY = [
  {
    id: 'screen-1',
    title: 'Screen 1: Front Center Stage',
    shortTitle: '1. Front Stage',
    angleLabel: '0° FRONT',
    desc: 'Ribby dancing center stage in maroon biker jacket with cyan lasers',
    src: RIBBY_IMAGES.front,
  },
  {
    id: 'screen-2',
    title: 'Screen 2: 3/4 Dynamic Orbit',
    shortTitle: '2. 3/4 Orbit',
    angleLabel: '65° ORBIT',
    desc: 'Kinetic 65° camera orbit highlighting ear piercings & jacket flare',
    src: RIBBY_IMAGES.orbit,
  },
  {
    id: 'screen-3',
    title: 'Screen 3: Facial Focus & Piercings',
    shortTitle: '3. Close-up',
    angleLabel: '140° CLOSE-UP',
    desc: 'Intimate close-up of violet eyes, headphones & cyan sub-dermal circuits',
    src: RIBBY_IMAGES.closeup,
  },
  {
    id: 'screen-4',
    title: 'Screen 4: Underground Club Wide',
    shortTitle: '4. Club Wide',
    angleLabel: '280° WIDE',
    desc: 'Packed dancefloor, crowd silhouettes & massive glowing RIBO neon sign',
    src: RIBBY_IMAGES.wide,
  },
];
