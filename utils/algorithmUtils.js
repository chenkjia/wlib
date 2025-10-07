
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
    // 短期均线向上
    MAS_UP: (i, {maS}) => {
      return maS[i-2] < maS[i-1] && maS[i-1] < maS[i]
    },
    // 短期均线向下
    MAS_DOWN: (i, {maS}) => {
      return maS[i-2] > maS[i-1] && maS[i-1] > maS[i]
    },
    // 中期均线向上
    MAM_UP: (i, {maM}) => {
      return maM[i-2] < maM[i-1] && maM[i-1] < maM[i]
    },
    // 中期均线向下
    MAM_DOWN: (i, {maM}) => {
      return maM[i-2] > maM[i-1] && maM[i-1] > maM[i]
    },
    // 长期均线向上
    MAL_UP: (i, {maL}) => {
      return maL[i-2] < maL[i-1] && maL[i-1] < maL[i]
    },
    // 长期均线向下
    MAL_DOWN: (i, {maL}) => {
      return maL[i-2] > maL[i-1] && maL[i-1] > maL[i]
    },
    // 远期均线向上
    MAX_UP: (i, {maX}) => {
      return maX[i-2] < maX[i-1] && maX[i-1] < maX[i]
    },
    // 远期均线向下
    MAX_DOWN: (i, {maX}) => {
      return maX[i-2] > maX[i-1] && maX[i-1] > maX[i]
    },
    // 短期均线从向下趋势变为向上趋势
    MAS_UPTREND: (i, {maS}) => {
      return maS[i-2] > maS[i-1] && maS[i] > maS[i-1]
    },
    // 短期均线从向上趋势变为向下趋势
    MAS_DOWNTREND: (i, {maS}) => {
      return maS[i-2] < maS[i-1] && maS[i] < maS[i-1]
    },
    // 中期均线从向下趋势变为向上趋势
    MAM_UPTREND: (i, {maM}) => {
      return maM[i-2] > maM[i-1] && maM[i] > maM[i-1]
    },
    // 中期均线从向上趋势变为向下趋势
    MAM_DOWNTREND: (i, {maM}) => {
      return maM[i-2] < maM[i-1] && maM[i] < maM[i-1]
    },
    // 长期均线从向下趋势变为向上趋势
    MAL_UPTREND: (i, {maL}) => {
      return maL[i-2] > maL[i-1] && maL[i] > maL[i-1]
    },
    // 长期均线从向上趋势变为向下趋势
    MAL_DOWNTREND: (i, {maL}) => {
      return maL[i-2] < maL[i-1] && maL[i] < maL[i-1]
    },
    // 远期均线从向下趋势变为向上趋势
    MAX_UPTREND: (i, {maX}) => {
      return maX[i-2] > maX[i-1] && maX[i] > maX[i-1]
    },
    // 远期均线从向上趋势变为向下趋势
    MAX_DOWNTREND: (i, {maX}) => {
      return maX[i-2] < maX[i-1] && maX[i] < maX[i-1]
    },
    MAS_EXPEND_MAM: (i, {maS, maM}) => {
      return maS[i]-maS[i-1] > maM[i]-maM[i-1]
    },
    MAS_CONTRACT_MAM: (i, {maS, maM}) => {
      return maS[i]-maS[i-1] < maM[i]-maM[i-1]
    },
    MAM_EXPEND_MAL: (i, {maM, maL}) => {
      return maM[i]-maM[i-1] > maL[i]-maL[i-1]
    },
    MAM_CONTRACT_MAL: (i, {maM, maL}) => {
      return maM[i]-maM[i-1] < maL[i]-maL[i-1]
    },
    MAL_EXPEND_MAX: (i, {maL, maX}) => {
      return maL[i]-maL[i-1] > maX[i]-maX[i-1]
    },
    MAL_CONTRACT_MAX: (i, {maL, maX}) => {
      return maL[i]-maL[i-1] < maX[i]-maX[i-1]
    },

  }

export { algorithmMap }