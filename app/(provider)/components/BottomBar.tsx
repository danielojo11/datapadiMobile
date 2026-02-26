import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

type BottomBarProps = {
  selectedNumber: number;
  onClick: () => void;
};

const BottomBar = ({ selectedNumber, onClick }: BottomBarProps) => {
  return (
    <View style={styles.bottomBar}>
      <View
        style={{
          backgroundColor: "white",
          width: 28,
          height: 28,
          borderRadius: 14,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View>
          <Text
            style={{
              color: "black",
              fontWeight: "bold",
            }}
          >
            {selectedNumber}{" "}
          </Text>
        </View>
      </View>
      <Text style={{ color: "white", fontWeight: "bold" }}>
        Batches Selected
      </Text>

      <TouchableOpacity style={styles.printAllButton} onPress={onClick}>
        <Ionicons name="print-outline" size={16} color={"white"} />
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Print All</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgb(17 24 39 )",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000000ff",
    borderRadius: 15,
  },
  printAllButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    gap: 2,
    verticalAlign: "middle",
  },
});

export default BottomBar;
