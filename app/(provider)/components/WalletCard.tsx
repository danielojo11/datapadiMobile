import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

type WalletProps = {
  balance: number;
  todaySpent: number;
  onFundWallet: () => void;
};

export default function WalletCard({
  balance,
  todaySpent,
  onFundWallet,
}: WalletProps) {
  const [gottenBalance, setGottenBalance] = useState(
    `₦${balance?.toLocaleString() || 0}`,
  );
  const changeBalanceText = () => {
    if (gottenBalance === "****") {
      setGottenBalance(`₦${balance.toLocaleString()}`);
    } else {
      setGottenBalance("****");
    }
  };
  return (
    <View
      style={{
        backgroundColor: "#1D4ED8",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: "white", fontSize: 14 }}>Wallet Balance</Text>
        <Ionicons
          name="eye-outline"
          size={18}
          color="white"
          onPress={() => changeBalanceText()}
        />
      </View>

      <Text
        style={{
          color: "white",
          fontSize: 32,
          fontWeight: "bold",
          marginTop: 10,
        }}
      >
        {gottenBalance.toLocaleString()}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <TouchableOpacity
          onPress={onFundWallet}
          style={{
            backgroundColor: "white",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#1D4ED8", fontWeight: "bold" }}>
            + Fund Wallet
          </Text>
        </TouchableOpacity>

        <View
          style={{
            alignItems: "flex-end",
            backgroundColor: "rgb(0 0 0 / 0.2)",
            paddingHorizontal: 20,
            paddingVertical: 5,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 10 }}>TODAY SPENT</Text>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
            <Ionicons name="trending-up" size={16} color={"green"} /> ₦
            {todaySpent.toLocaleString() || 0}
          </Text>
        </View>
      </View>
    </View>
  );
}
