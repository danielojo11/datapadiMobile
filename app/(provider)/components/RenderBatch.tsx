import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type RenderBatchProps = {
  item: any;
  selectMode: any;
  selectedBatches: any;
  setSelectedBatches: any;
};

const RenderBatch = ({
  item,
  selectMode,
  selectedBatches,
  setSelectedBatches,
}: RenderBatchProps) => {
  const isSelected = selectedBatches.includes(item.id);

  const toggleSelectBatch = (id: any) => {
    if (selectedBatches.includes(id)) {
      setSelectedBatches(
        selectedBatches.filter((batchId: any) => batchId !== id),
      );
    } else {
      setSelectedBatches([...selectedBatches, id]);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.batchCard,
        selectMode && isSelected && styles.selectedBatch,
      ]}
      onPress={() => selectMode && toggleSelectBatch(item.id)}
    >
      <View style={styles.batchHeader}>
        <View
          style={[
            styles.operatorIcon,
            {
              backgroundColor: item.operator === "MTN" ? "#FFD700" : "#FF7F7F",
            },
          ]}
        >
          <Text style={styles.operatorInitial}>{item.operator[0]}</Text>
        </View>
        <Text style={styles.batchTitle}>
          <Text>
            {item.operator} ₦{item.amount} PINs
          </Text>
          <View>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        </Text>
        <View>
          <Text style={styles.status}>{item.status}</Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 15,
          }}
        >
          <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            {selectMode ? (
              <TouchableOpacity onPress={() => toggleSelectBatch(item.id)}>
                <Text style={styles.selectButton}></Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text
                    style={{
                      color: "rgb(29 78 216)",
                      fontWeight: "bold",
                      verticalAlign: "middle",
                      marginBottom: 10,
                    }}
                  >
                    {" "}
                    <Ionicons
                      name="print-outline"
                      size={18}
                      style={{ marginBottom: 5 }}
                    />{" "}
                    View/Print
                  </Text>
                </TouchableOpacity>
                <Ionicons
                  name="download-outline"
                  size={16}
                  style={{
                    marginRight: 12,
                    borderRadius: 6,
                    flexDirection: "row-reverse",
                    paddingVertical: 6,
                  }}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {selectMode && isSelected && (
        <View style={styles.checkbox}>
          <Text>
            <Ionicons name="checkmark-circle" color={"green"} size={20} />
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  batchCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    position: "relative",
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectButton: { marginTop: 8, color: "#3b82f6", fontWeight: "bold" },
  selectedBatch: { borderWidth: 2, borderColor: "#3b82f6" },
  operatorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  operatorInitial: { fontWeight: "bold", color: "#fff" },
  batchTitle: { flex: 1, marginLeft: 8, fontWeight: "bold" },
  status: {
    color: "green",
    fontWeight: "bold",
    backgroundColor: "rgba(204, 255, 204, 1)",
    borderRadius: 15,
    padding: 5,
    fontSize: 11,
  },
  date: { color: "#6b7280", marginVertical: 4, fontSize: 11 },
  quantity: { fontWeight: "500" },
  actions: { flexDirection: "row", marginTop: 8 },
  actionButton: {
    marginRight: 12,
    borderRadius: 6,
    flexDirection: "row-reverse",
    backgroundColor: "#ccd6f244",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  checkbox: { position: "absolute", bottom: 8, right: 8 },
});

export default RenderBatch;
