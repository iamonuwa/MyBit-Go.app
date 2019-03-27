import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose'
import { withMetamaskContext } from 'components/MetamaskContext';
import { withBlockchainContext } from 'components/BlockchainContext';
import {
  formatMonetaryValue,
  fromWeiToEth,
} from 'utils/helpers';
import ERRORS from './errors';
import * as Brain from '../../apis/brain';
import dayjs from 'dayjs';

class ManageAssetModule extends React.Component{
  state = {
    loading: true,
  }

  processAssetInfo = async (props, asset) => {
    if(this._processingAssetInfo){
      return;
    } else {
      this._processingAssetInfo = true;
    }
    const {
      blockchainContext,
      metamaskContext,
    } = props;

    const {
      withdrawingCollateral,
      withdrawingAssetManager,
      withdrawCollateral,
      withdrawProfitAssetManager,
    } = blockchainContext;

    try{
      const {
        assetId,
        collateral,
        assetIncome,
        daysSinceItWentLive,
        assetManager,
        managerPercentage,
        fundingGoal,
      } = asset;

      // calculate collateral data to be displayed
      const remainingEscrow = window.web3js.utils.fromWei(await Brain.remainingEscrow(asset.assetId), 'ether');
      const percentageWithdrawn = remainingEscrow !== collateral ? 100 - ((remainingEscrow * 100) / collateral) : 0;
      const percentageWithdrawableCollateralUsd = ((assetIncome * 100) / fundingGoal) / 100;
      const collateralData = [];
      for(let i = 1; i < 5; i++){
        const required = (25 * i)/100 * fundingGoal;

        if(percentageWithdrawableCollateralUsd >= (25 * i) / 100){
          const withdrawable = ((25 * i) > percentageWithdrawn);
          collateralData.push({
            withdrawable,
            current: required,
            required,
            paidOut: !withdrawable,
          })
        } else {
          let current = 0;
          const minValue = i - 1 === 0 ? 0 : (25 * (i -1))/100;
          const maxValue = (25 * i)/100;
          if(percentageWithdrawableCollateralUsd < maxValue && percentageWithdrawableCollateralUsd > minValue){
            current = percentageWithdrawableCollateralUsd * fundingGoal;
          }
          collateralData.push({
            withdrawable: false,
            current,
            required,
          })
        }
      }

      // calculate asset manager profits
      const assetManagerProfits = [];
      const revenueRawData = await Brain.fetchRevenueLogsByAssetId(asset.assetId);
      const revenueData = revenueRawData.map(revenue => {
        return {
          amount: fromWeiToEth(revenue.amount),
          date: dayjs(revenue.timestamp * 1000),
        }
      })

      //calculate how much the asset manager can withdraw
      const [totalIncome, totalWithdrawn] = await Promise.all([Brain.getManagerIncomeEarned(assetManager, asset.assetId), Brain.getManagerIncomeWithdraw(assetManager, asset.assetId)]);

      //set the state with the calculated data
      const profit = assetIncome * (managerPercentage / 100);

      let withdrawMax;
      let percentageMax;

      let alreadyWithdrawn = 0;
      collateralData.forEach((data, index) => {
        if(data.paidOut){
          alreadyWithdrawn += 1;
        }
        else if(data.withdrawable){
          withdrawMax = (collateral / 4) * (index + 1 - alreadyWithdrawn);
          percentageMax = 25 * (index + 1 - alreadyWithdrawn);
        }
      })

      const averageProfit = profit / daysSinceItWentLive;

      const toWithdrawWei = totalIncome - totalWithdrawn;
      const toWithdraw = window.web3js.utils.fromWei(toWithdrawWei.toString(), 'ether');

      const isWithdrawingCollateral = withdrawingCollateral.includes(assetId);
      const isWithdrawingAssetManager = withdrawingAssetManager.includes(assetId);

      this.setState({
        loading: false,
        assetInfo: {
          userAddress: metamaskContext.user.address,
          asset: asset,
          methods: {
            withdrawCollateral: !isWithdrawingCollateral ? () => withdrawCollateral(asset, percentageMax, withdrawMax) : undefined,
            withdrawProfitAssetManager: !isWithdrawingAssetManager ? () => withdrawProfitAssetManager(asset, toWithdraw): undefined,
          },
          finantialDetails: {
            assetManagerProfits,
            collateralData,
            revenueData,
            toWithdraw,
            isWithdrawingCollateral,
            isWithdrawingAssetManager,
            profit,
            withdrawMax,
            percentageMax,
            averageProfit,
          }
        }
      }, () => console.log(this.state));
      this._processingAssetInfo = false;
    }catch(err){
      this._processingAssetInfo = false;
      console.log(err)
    }
  }

  componentDidMount = () => {
    if(window){
      this.getData();
    }
  }

  componentWillReceiveProps = (nextProps) => {
    this.getData(nextProps);
  }

  getData = async (props) => {
    const {
      blockchainContext,
      metamaskContext,
      assetId: requestedAssetId,
    } = props || this.props;

    const {
      loading,
      assets,
    } = blockchainContext;

    const {
      user,
    } = metamaskContext;

    if(loading.assets){
      this.setState({
        loading: true,
      })
    } else {
      const asset = assets.find(({ assetId }) => assetId === requestedAssetId);
      let errorType, assetInfo;
      if(!asset){
        errorType = ERRORS.NO_ASSET;
      } else if (user.address !== asset.assetManager){
        errorType = ERRORS.NO_PERMISSION;
      } else if(!asset.funded && asset.pastDate){
        errorType = ERRORS.ASSET_FUNDING_FAILED;
      } else if(!asset.funded){
        errorType = ERRORS.ASSET_NOT_FUNDED;
      } else {
        this.processAssetInfo(props || this.props, asset);
      }

      if(errorType){
        this.setState({
          loading: false,
          error: {
            type: errorType,
          },
        })
      } else if(this.state.error){
        this.setState({
          loading: true,
          error: undefined,
        })
      }
    }
  }

  render = () => this.props.children(this.state);
 }

ManageAssetModule.propTypes = {
  assetId: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
};

const enhance = compose(
  withMetamaskContext,
  withBlockchainContext,
);

export default enhance(ManageAssetModule);;
