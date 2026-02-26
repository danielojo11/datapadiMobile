import React from "react";
import { View, StyleSheet } from "react-native";
import BottomSheetContainer from "../BottomSheet";
import CardSummaryHeader from "../CardSummary";
import VoucherList from "../VoucherList";

type Voucher = {
  id: string;
  serialNumber: string;
  pin: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  network: string;
  planName: string;
  amount: string;
  vouchers: Voucher[];
};

const CardPreviewModal: React.FC<Props> = ({
  visible,
  onClose,
  network,
  planName,
  amount,
  vouchers,
}) => {
  const totalValue = `₦${
    vouchers.length * parseInt(amount.replace(/\D/g, ""))
  }`;

  return (
    <BottomSheetContainer
      visible={visible}
      title="Card Preview & Print"
      onClose={onClose}
    >
      <View style={styles.content}>
        {/* Summary */}
        <CardSummaryHeader
          networkName={network}
          planName={planName}
          cardsGenerated={vouchers.length}
          totalValue={totalValue}
        />

        {/* Voucher List */}
        <VoucherList vouchers={vouchers} network={network} amount={planName} />
      </View>
    </BottomSheetContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 20,
  },
});

export default CardPreviewModal;
