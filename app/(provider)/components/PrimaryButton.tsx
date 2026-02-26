import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
};

const PrimaryButton: React.FC<Props> = ({ title, onPress, loading }) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <>
          <Text style={styles.text}>{title}</Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#FFF"
            style={{ marginLeft: 6 }}
          />
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 54,
    backgroundColor: "#1D4ED8",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 10,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  text: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default PrimaryButton;
