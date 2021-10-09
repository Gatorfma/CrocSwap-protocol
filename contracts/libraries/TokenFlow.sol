// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

import './Chaining.sol';

library TokenFlow {

    struct PairSeq {
        address baseToken_;
        address quoteToken_;
        bool isBaseFront_;
        int256 legFlow_;
        Chaining.PairFlow flow_;
    }

    function initSeq() pure internal returns (PairSeq memory) {
        return PairSeq({baseToken_: address(0), quoteToken_: address(0),
                    isBaseFront_: false, legFlow_: 0, flow_: Chaining.initFlow()});
    }

    
    function nextHop (PairSeq memory seq, address tokenFront, address tokenBack)
        pure internal {
        seq.isBaseFront_ = tokenFront < tokenBack;
        if (seq.isBaseFront_) {
            seq.baseToken_ = tokenFront;
            seq.quoteToken_ = tokenBack;
        } else {
            seq.quoteToken_ = tokenFront;
            seq.baseToken_ = tokenBack;
        }
    }

    function clipFlow (PairSeq memory seq) internal pure returns (int256 clippedFlow) {
        (int256 frontFlow, int256 backFlow) = seq.isBaseFront_ ?
            (seq.flow_.baseFlow_, seq.flow_.quoteFlow_) :
            (seq.flow_.quoteFlow_, seq.flow_.baseFlow_);
        
        clippedFlow = seq.legFlow_ + frontFlow;
        seq.legFlow_ = backFlow;
        seq.flow_ = Chaining.initFlow();
    }
    
    function closeFlow (PairSeq memory seq) internal pure returns (int256) {
        return seq.legFlow_;
    }

    function isEtherNative (address token) internal pure returns (bool) {
        return token == address(0);
    }
}
