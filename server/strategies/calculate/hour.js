import {
  calculateMA
} from './common.js';

function calculateHourMetric(hourLine) {
  if (!Array.isArray(hourLine) || hourLine.length === 0) {
      return [];
  }

  const hourClose = hourLine.map(item => item.close);
  const hourVolume = hourLine.map(item => item.volume);
  const maS = calculateMA(hourClose, 7);
  const maM = calculateMA(hourClose, 14);
  const maL = calculateMA(hourClose, 50);
  const maXL = calculateMA(hourClose, 100);
  const volumeMaS = calculateMA(hourVolume, 7);
  const volumeMaM = calculateMA(hourVolume, 14);
  const volumeMaL = calculateMA(hourVolume, 50);
  const volumeMaXL = calculateMA(hourVolume, 100);
  // const maS = calculateMA(hourClose, 20);
  // const maM = calculateMA(hourClose, 60);
  // const maL = calculateMA(hourClose, 120);
  // const maXL = calculateMA(hourClose, 240);

  return hourLine.map((item, index) => ({
      date: item.date,
      maS: maS[index],
      maM: maM[index],
      maL: maL[index],
      maXL: maXL[index],
      volumeMaS: volumeMaS[index],
      volumeMaM: volumeMaM[index],
      volumeMaL: volumeMaL[index],
      volumeMaXL: volumeMaXL[index],
  }));
}
export {
    calculateHourMetric
};