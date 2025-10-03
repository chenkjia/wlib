
// 算法工具函数

const algorithmMap = {
    MAS_GT_MAM: (i, {maS, maM})  => {
      return maS[i] > maM[i]
    },
    MAS_LT_MAM: (i, {maS, maM}) => {
      return maS[i] < maM[i]
    },
    MAS_CROSS_UP_MAM: (i, {maS, maM}) => {
      return maS[i-1] < maM[i-1] && maS[i] >= maM[i]
    },
    MAS_CROSS_DOWN_MAM: (i, {maS, maM}) => {
      return maS[i-1] > maM[i-1] && maS[i] <= maM[i]
    },
    MAM_GT_MAL: (i, {maM, maL}) => {
      return maM[i] > maL[i]
    },
    MAM_LT_MAL: (i, {maM, maL}) => {
      return maM[i] < maL[i]
    },
    MAM_CROSS_UP_MAL: (i, {maM, maL}) => {
      return maM[i-1] < maL[i-1] && maM[i] >= maL[i]
    },
    MAM_CROSS_DOWN_MAL: (i, {maM, maL}) => {
      return maM[i-1] > maL[i-1] && maM[i] <= maL[i]
    },
    MAL_GT_MAX: (i, {maL, maX}) => {
      return maL[i] > maX[i]
    },
    MAL_LT_MAX: (i, {maL, maX}) => {
      return maL[i] < maX[i]
    },
    MAL_CROSS_UP_MAX: (i, {maL, maX}) => {
      return maL[i-1] < maX[i-1] && maL[i] >= maX[i]
    },
    MAL_CROSS_DOWN_MAX: (i, {maL, maX}) => {
      return maL[i-1] > maX[i-1] && maL[i] <= maX[i]
    },
    VOLUME_HIGH: (i, {volume}) => {
      return volume[i] > volume[i-1] * 1.1
    },
    VOLUME_LOW: (i, {volume}) => {
      return volume[i] < volume[i-1] * 0.9
    },
    SIGN1: (i, {sign1}) => {
      return sign1[i] < 50
    },
    // macd金叉
    MACD_CROSS_UP_GOLDEN: (i, {dif, dea}) => {
      return dif[i-1] < dea[i-1] && dif[i] >= dea[i]
        && (dea[i-1] <= 0 || Math.abs(dea[i-1]) < 0.05)
    },
    // macd死叉
    MACD_CROSS_DOWN_DEAD: (i, {dif, dea}) => {
      return dif[i-1] > dea[i-1] && dif[i] <= dea[i]
        && (dea[i-1] >= 0 || Math.abs(dea[i-1]) < 0.05)
    },
    // macd底背离
    MACD_BOTTOM_DEVIATION: (i, {dif, line}) => {
      return (line[i].low < line[i-1].low) && (dif[i] > dif[i-1]) && (dif[i] < 0)
    },
    // macd顶背离
    MACD_TOP_DEVIATION: (i, {dif, line}) => {
      return (line[i].high > line[i-1].high) && (dif[i] < dif[i-1]) && (dif[i] > 0)
    },
  }

export { algorithmMap }