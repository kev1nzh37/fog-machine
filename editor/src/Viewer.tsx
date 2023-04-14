import { MapRenderer } from "./utils/MapRenderer";
import { useEffect, useState } from "react";
import { createMapFromZip } from "./Import";
import TimeMachineApi, { SnapshotInfo } from "./utils/TimeMachineApi";
import moment from "moment";
import MainMenu from "./MainMenu";

type Props = {
  mapRenderer: MapRenderer;
  initialSnapshotId: number | number[];
  setLoaded(isLoaded: boolean): void;
  msgboxShow(title: string, msg: string): void;
};

// User may switch between snapshots a lot and the sansphotId -> data mapping should be immutable.
// So let's cache it.
// TODO: improve caching. e.g. size limit / not in memory / share across sessions
const gloablSnapshotCache: { [key: number]: ArrayBuffer } = {};

function Viewer(props: Props): JSX.Element {
  const mapRenderer = props.mapRenderer;
  const [snapshotId, setSnapshotId] = useState(props.initialSnapshotId);
  const [snapshotInfo, setSnapshotInfo] = useState<SnapshotInfo | null>(null);

  const initViewingSnapshot = async (id: number) => {
    const snapshotInfoRes = await TimeMachineApi.getSnapshotInfo(id);
    if (!snapshotInfoRes.ok) {
      console.log(snapshotInfoRes);
      props.msgboxShow("error", "error-failed-to-load-snapshot");
      return;
    }
    const snapshotInfo = snapshotInfoRes.ok;

    let snapshot;
    if (gloablSnapshotCache[snapshotInfo.id]) {
      snapshot = gloablSnapshotCache[snapshotInfo.id];
    } else {
      const snapshotRes = await TimeMachineApi.downloadSnapshot(
        snapshotInfo.downloadToken
      );
      if (!snapshotRes.ok) {
        console.log(snapshotInfoRes);
        props.msgboxShow("error", "error-failed-to-load-snapshot");
        return;
      }
      snapshot = snapshotRes.ok;
      gloablSnapshotCache[snapshotInfo.id] = snapshot;
    }
    const map = await createMapFromZip(snapshot);
    mapRenderer.replaceFogMap(map);
    setSnapshotInfo(snapshotInfo);
  };

  const checkSnapshotInCache = async (
    snapshotInfo: SnapshotInfo
  ): Promise<ArrayBuffer | undefined> => {
    let snapshot;
    if (gloablSnapshotCache[snapshotInfo.id]) {
      snapshot = gloablSnapshotCache[snapshotInfo.id];
    } else {
      const snapshotRes = await TimeMachineApi.downloadSnapshot(
        snapshotInfo.downloadToken
      );
      if (!snapshotRes.ok) {
        props.msgboxShow("error", "error-failed-to-load-snapshot");
        return;
      }
      snapshot = snapshotRes.ok;
      gloablSnapshotCache[snapshotInfo.id] = snapshot;
    }
    return snapshot;
  };
  const initContrastSnapshot = async (id1: number, id2: number) => {
    const [snapshotInfoRes1, snapshotInfoRes2] = await Promise.all([
      TimeMachineApi.getSnapshotInfo(id1),
      TimeMachineApi.getSnapshotInfo(id2),
    ]);
    if (!snapshotInfoRes1.ok || !snapshotInfoRes2.ok) {
      console.log(snapshotInfoRes1, snapshotInfoRes2);
      props.msgboxShow("error", "error-failed-to-load-snapshot");
      return;
    }
    const [snapshotInfo1, snapshotInfo2] = [
      snapshotInfoRes1.ok,
      snapshotInfoRes2.ok,
    ];

    const [snapshot1, snapshot2] = await Promise.all([
      checkSnapshotInCache(snapshotInfo1),
      checkSnapshotInCache(snapshotInfo2),
    ]);

    if (!snapshot1 || !snapshot2) {
      console.log("............");
      return;
    }
    let map = await createMapFromZip(snapshot1);
    map = await createMapFromZip(snapshot2, map);

    mapRenderer.replaceFogMap(map);
    setSnapshotInfo(snapshotInfo);
  };
  const loadSnapshot = async () => {
    console.log("loading snapshot", snapshotId);
    props.setLoaded(false);
    // TODO: use react router
    history.replaceState({}, "", "?viewing-snapshot=" + String(snapshotId));
    if (Array.isArray(snapshotId)) {
      const [snapshotId1, snapshotId2] = snapshotId;
      initContrastSnapshot(snapshotId1, snapshotId2);
    } else {
      initViewingSnapshot(snapshotId);
    }
    props.setLoaded(true);
  };

  useEffect(() => {
    loadSnapshot();
  }, [snapshotId]);

  if (!snapshotInfo) {
    return <></>;
  } else {
    const commonClassName =
      "flex items-center justify-center mx-2 h-9 p-2 bg-white shadow rounded-lg";
    return (
      <>
        <MainMenu
          mapRenderer={mapRenderer}
          msgboxShow={props.msgboxShow}
          mode="viewer"
        />

        <div className="absolute bottom-0 pb-4 z-10 pointer-events-none flex justify-center w-full">
          <button
            className={
              commonClassName +
              " hover:bg-gray-200 active:bg-gray-400 pointer-events-auto text-gray-700 opacity-80" +
              (snapshotInfo.prev != null ? "" : " invisible")
            }
            onClick={() => {
              if (snapshotInfo.prev) {
                setSnapshotId(snapshotInfo.prev.id);
              }
            }}
          >
            {moment(snapshotInfo.prev?.timestamp).format("YYYY-MM-DD") + " <"}
          </button>

          <button
            className={
              commonClassName + " active:bg-gray-400 ring-4 ring-gray-700"
            }
          >
            {moment(snapshotInfo.timestamp).format("YYYY-MM-DD")}
          </button>

          <button
            className={
              commonClassName +
              " hover:bg-gray-200 active:bg-gray-400 pointer-events-auto text-gray-700 opacity-80" +
              (snapshotInfo.next != null ? "" : " invisible")
            }
            onClick={() => {
              if (snapshotInfo.next) {
                setSnapshotId(snapshotInfo.next.id);
              }
            }}
          >
            {"> " + moment(snapshotInfo.next?.timestamp).format("YYYY-MM-DD")}
          </button>
        </div>
      </>
    );
  }
}

export default Viewer;
