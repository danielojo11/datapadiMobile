import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

export default function ProfileWallet() {
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("8234567890");
  const handleCopy = async (account: string) => {
    await Clipboard.setStringAsync(account);
  };
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="wallet-outline" size={18} color="#fff" />
        <Text style={styles.headerText}>Wallet Funding</Text>
      </View>
      <>
        <Text style={styles.subTitle}>DEDICATED ACCOUNT NUMBER</Text>

        <View style={styles.accountRow}>
          <View>
            <Text style={styles.accountNumber}>{accountNumber}</Text>
            <Text style={styles.bankText}>Wema Bank • DataPadi - Yadak</Text>
          </View>

          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => handleCopy(accountNumber)}
          >
            <Ionicons name="copy-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color="#C7D2FE"
          />
          <Text style={styles.infoText}>
            Transfers to this account automatically fund your wallet instantly.
          </Text>
        </View>
      </>

      <Text style={styles.description}>
        Enter amount to fund your wallet instantly via Card or Bank Transfer
        (Flutterwave).
      </Text>

      {/* Amount Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.currencySymbol}>₦</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount (e.g. 5000)"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      {/* Blank White Box (Likely a primary action button like 'Proceed') */}
      <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          <Ionicons name="card" size={16} /> Pay with Card
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        {/* Footer Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            Want a permanent account number?{" "}
          </Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>Verify Identity</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E40AF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 15,
  },
  headerText: {
    color: "#fff",
    fontWeight: "600",
  },
  subTitle: {
    color: "#C7D2FE",
    fontSize: 11,
    marginBottom: 8,
  },
  accountRow: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  bankText: {
    color: "#C7D2FE",
    fontSize: 10,
    marginTop: 4,
  },
  copyBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    gap: 6,
  },
  infoText: {
    color: "#C7D2FE",
    fontSize: 10,
    flex: 1,
  },

  // new styles

  cardContainer: {
    backgroundColor: "#2554D3", // Matches the rich blue from the design
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16, // Assuming it sits inside a padded screen
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  iconBox: {
    backgroundColor: "rgba(255, 255, 255, 0.15)", // Semi-transparent overlay
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  walletIcon: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  description: {
    fontSize: 14,
    color: "#D1DEFF", // Soft light blue for readable contrast
    lineHeight: 22,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  chevronIcon: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: 8,
  },
  actionButton: {
    backgroundColor: "#2554D3",
    height: 56,
    borderRadius: 10,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#fff",
    borderWidth: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: 12,
    color: "#D1DEFF",
  },
  linkText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
