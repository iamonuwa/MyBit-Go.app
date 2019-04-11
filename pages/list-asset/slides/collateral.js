import React from 'react';
import styled, { css } from 'styled-components';
import {
  CarouselSlide,
  CarouselSlideMainTitle,
  CarouselSlideParagraph,
  CarouselSlideTooltip,
} from 'components/CarouselSlide/';
import {
  Slider,
} from 'antd';
import {
  convertTokenAmount,
  getDecimalsForToken,
  formatValueForToken,
} from 'utils/helpers';
import {
  PLATFORM_TOKEN,
} from 'constants/app';
import Myb from "static/list-asset/assetList_myb.png";
import { withMetamaskContext } from 'components/MetamaskContext';
import TokenSelector from 'components/TokenSelector';
import NumericInput from 'ui/NumericInput';
import Spin from 'static/spin.svg';

const Image = styled.img`
  position: relative;
  margin: 40px auto;
  width: 90px;
  heght: 65px;
}`

const formatter = (value) => {
  return `${value}%`;
}

const InputsWrapper = styled.div`
  margin: 0 auto;

  .ant-slider{
    margin-bottom: 20px;
  }

  span{
    margin: 0% 2%;
  }

  ${({theme}) => theme.tablet`
    width: 95%;
  `}
`;

const Separator = styled.span`
  position: relative;
  top: 5px;
  left: 5px;
`

const MybitInput = styled.div`
  width: 46%;
  display: inline-block;
`
const TokenSelectorWrapper = styled.div`
  width: 46%;
  display: inline-block;

  button{
    background-color: transparent;
    border: none;
    height: auto;
    padding: 0px 5px;

    .anticon {
      margin: 0px 3px;
    }
  }

  .ant-input-group-addon{
    padding: 0px 0px;
    ${props => props.selectorIsDisabled && css`
      background-color: #f5f5f5;
      border-color: #d9d9d9;
    `}
  }
`

const Loading = styled(Spin)`
  display: block;
  margin: 0 auto;
  height: 32px;
  width: 32px;
`

export const CollateralSlide = ({
  maxWidthDesktop,
  handleCollateralChange,
  collateralPercentage,
  collateralMyb,
  collateralDai,
  formData,
  handleSelectedTokenChange,
  selectedToken,
  balances,
  maxCollateralPercentage,
  collateralSelectedToken,
  kyberLoading,
}) => {
  const noBalance = !balances || Object.keys(balances).length === 0;
  const decimalsOfSelectedTokens = getDecimalsForToken(selectedToken);
  const decimalsOfPlatformToken = getDecimalsForToken(PLATFORM_TOKEN);
  const collateralSelectedTokenFormatted = formatValueForToken(collateralSelectedToken, selectedToken);
  const collateralPlatformTokenFormatted = formatValueForToken(collateralMyb, PLATFORM_TOKEN);
  return (
    <CarouselSlide
      maxWidthDesktop={maxWidthDesktop}
    >
      <CarouselSlideMainTitle
        isLong
        isSmallMobile
        isCentered
        maxWidthDesktop={maxWidthDesktop}
      >
        <React.Fragment>
          Asset collateral
          <CarouselSlideTooltip
            title="Assets with a high collateral are more likely to get funded."
          />
        </React.Fragment>
      </CarouselSlideMainTitle>
      <CarouselSlideParagraph
        isCentered
        maxWidthDesktop={maxWidthDesktop}
      >
        {`${PLATFORM_TOKEN} is used as an insurance mechanism, much like a deposit to protect
        investors' funds and incentivise proper behaviour.`}
      </CarouselSlideParagraph>
      {kyberLoading && (
        <React.Fragment>
          <CarouselSlideParagraph
            isCentered
            maxWidthDesktop={maxWidthDesktop}
            style={{marginTop: '60px'}}
          >
            Loading data from Kyber
          </CarouselSlideParagraph>
           <Loading />
        </React.Fragment>
      )}
      {!kyberLoading && (
        <React.Fragment>
          <Image
            src={Myb}
            alt="MyBit"
          />
          <InputsWrapper>
            <Slider
              tipFormatter={formatter}
              min={0}
              max={maxCollateralPercentage}
              defaultValue={collateralPercentage}
              value={collateralPercentage}
              onChange={value => handleCollateralChange({selectedAmount: value}, "percentage")}
              disabled={noBalance}
            />
            <MybitInput>
              <NumericInput
                defaultValue={collateralPlatformTokenFormatted}
                value={collateralPlatformTokenFormatted}
                min={0}
                label={PLATFORM_TOKEN}
                onChange={value => handleCollateralChange({selectedAmount: value}, "myb")}
                decimalPlaces={decimalsOfPlatformToken.decimals}
                step={decimalsOfPlatformToken.step}
                disabled={noBalance}
              />
            </MybitInput>
            <Separator>=</Separator>
            <TokenSelectorWrapper
              selectorIsDisabled={noBalance}
            >
              <NumericInput
                defaultValue={collateralSelectedTokenFormatted}
                value={collateralSelectedTokenFormatted}
                min={0}
                disabled={noBalance}
                step={decimalsOfSelectedTokens.step}
                decimalPlaces={decimalsOfSelectedTokens.decimals}
                label={
                  <TokenSelector
                    balances={balances}
                    amountToPay={collateralDai}
                    onChange={handleSelectedTokenChange}
                  />
                }
                onChange={value => handleCollateralChange({selectedAmount: value}, "selectedToken")}
              />

            </TokenSelectorWrapper>
          </InputsWrapper>
        </React.Fragment>
      )}
    </CarouselSlide>
  )}