import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoryTabs from "../components/CategoryTab";
import TransactionCard from "../components/TransactionCard";

export default function history() {
  const [active, setActive] = useState("All");

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: "#f5f5f5",
      }}
    >
      <Text style={styles.header}>Transactions</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 90 }}
      >
        <CategoryTabs active={active} setActive={setActive} />
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TransactionCard
          type="wifi"
          title="MTN 1GB SME to 0803..."
          date="10/25/2023"
          amount="-₦260"
          status="SUCCESS"
        />

        <TransactionCard
          type="print"
          title="Printed 10 MTN N100 Pins"
          date="10/24/2023"
          amount="-₦1,000"
          status="SUCCESS"
        />

        <TransactionCard
          type="wallet"
          title="Wallet Funding via Transfer"
          date="10/23/2023"
          amount="+₦5,000"
          status="SUCCESS"
        />

        <TransactionCard
          type="airtime"
          title="Airtime to 0902..."
          date="10/22/2023"
          amount="-₦500"
          status="FAILED"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 40,
  },
});
