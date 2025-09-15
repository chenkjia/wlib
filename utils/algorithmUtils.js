
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
    }
  }

export { algorithmMap }