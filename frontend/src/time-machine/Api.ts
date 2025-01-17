// TODO: type safe?
/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "axios";
import { toCamel, toSnake } from "snake-camel";

// I really want ADT x2
type Ok<T> = {
  status: number;
  ok: T;
  error?: never;
  unknownError?: never;
};

type Error = {
  status: number;
  ok?: never;
  error: string;
  unknownError?: never;
};

type UnknownError = {
  status: number | null;
  ok?: never;
  error?: never;
  unknownError: string;
};

type Result<T> = Ok<T> | Error | UnknownError;

type UserInfo = { language: "zh-cn" | "en-us" };

type GithubSsoResponse = {
  login: boolean;
  token?: string;
  defaultEmail?: string;
  registrationToken?: string;
};

export type SnapshotTask = {
  errorCount: number;
  interval: number;
  lastSuccessSync: Date | null;
  source: { OneDrive: { shareUrl: string } };
  status: "Running" | "Paused" | "Stopped";
};

export type Snapshot = {
  id: number;
  timestamp: Date;
  sourceKind: "Sync" | "Upload";
  note: string | null;
};

export type SnapshotList = {
  numberOfSnapshots: number;
  numberOfPages: number;
  snapshots: Snapshot[];
};

export type SnapshotUploadResult = {
  id: number;
  fileCount: number;
  logs: string;
};

export default class Api {
  public static readonly backendUrl =
    process.env.REACT_APP_BACKEND_URL + "/api/v1/";
  private static readonly tokenKey = "user-token";

  private static getToken(): string | null {
    let token = sessionStorage.getItem(this.tokenKey);
    if (!token) {
      token = localStorage.getItem(this.tokenKey);
    }
    return token;
  }

  public static tokenHeaders() {
    return { Authorization: "Bearer " + this.getToken() };
  }

  private static clearToken() {
    sessionStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.tokenKey);
  }

  public static logout() {
    this.clearToken();
  }

  public static async requestApi(
    url: string,
    method: "get" | "post" | "patch" | "delete",
    needToken: boolean,
    data?: { [key: string]: any }
  ): Promise<Result<any>> {
    try {
      console.log("requesting api:", method, " ", url);
      const headers = needToken ? this.tokenHeaders() : undefined;
      const response = await axios({
        method,
        url: this.backendUrl + url,
        data,
        headers,
      });
      return { status: response.status, ok: response.data };
    } catch (error: any) {
      const status = error.response?.status;
      const knownError = error.response?.data?.error;
      const e: Error | UnknownError =
        status && knownError
          ? { status: status, error: knownError }
          : { status: status, unknownError: String(error) };

      console.log("api error:", e);
      return e;
    }
  }

  public static async getUserInfo(): Promise<UserInfo | null> {
    // short circuit
    if (!this.getToken()) {
      return null;
    }

    const result = await this.requestApi("user", "get", true);
    if (result.ok) {
      return result.ok;
    } else {
      return null;
    }
  }

  public static async githubSso(
    code: string
  ): Promise<Result<GithubSsoResponse>> {
    const result = await this.requestApi("user/sso/github", "post", false, {
      code,
    });
    if (result.ok) {
      result.ok = toCamel(result.ok);
      const data: GithubSsoResponse = result.ok;

      if (data.login && data.token) {
        // TODO: only put the token to session storage if the user doesn't want to keep logged in
        localStorage.setItem(this.tokenKey, data.token);
      }
    }
    return result;
  }

  public static async register(
    registrationToken: string,
    contactEmail: string,
    language: "zh-cn" | "en-us"
  ): Promise<Result<"ok">> {
    const result = await this.requestApi(
      "user/sso",
      "post",
      false,
      toSnake({
        registrationToken,
        contactEmail,
        language,
      })
    );

    if (result.ok) {
      localStorage.setItem(this.tokenKey, result.ok.token);
      result.ok = "ok";
    }
    return result;
  }

  public static async getSnapshotTask(): Promise<
    Result<SnapshotTask | "none">
  > {
    let result = await this.requestApi("snapshot_task", "get", true);
    if (result.ok) {
      result.ok = toCamel(result.ok);
      if (result.ok.source["OneDrive"]) {
        result.ok.source["OneDrive"] = toCamel(result.ok.source["OneDrive"]);
      }
    } else if (result.status == 404) {
      result = { ok: "none", status: 404 };
    }
    return result;
  }

  public static async updateSnapshotTask(
    interval: number | null,
    status: "Running" | "Paused" | null,
    oneDriveShareUrl: string | null
  ): Promise<Result<"ok">> {
    const data: any = {};
    if (interval) {
      data["interval"] = interval;
    }
    if (status) {
      data["status"] = status;
    }
    if (oneDriveShareUrl) {
      data["source"] = {
        OneDrive: toSnake({
          shareUrl: oneDriveShareUrl,
        }),
      };
    }

    const result = await this.requestApi("snapshot_task", "patch", true, data);
    if (result.ok) {
      result.ok = "ok";
    }
    return result;
  }

  public static async deleteSnapshot(id: number): Promise<Result<"ok">> {
    const result = await this.requestApi(
      "snapshot/" + String(id),
      "delete",
      true
    );
    if (result.ok) {
      result.ok = "ok";
    }
    return result;
  }

  public static async uploadSnapshot(
    timestamp: Date,
    uploadToken: string
  ): Promise<Result<SnapshotUploadResult>> {
    const data: any = {};
    data["timestamp"] = timestamp;
    data["upload_token"] = uploadToken;
    const result = await this.requestApi("snapshot", "post", true, data);
    if (result.ok) {
      result.ok = toCamel(result.ok);
    }
    return result;
  }

  public static async createSnapshotTask(
    interval: number,
    oneDriveShareUrl: string
  ): Promise<Result<"ok">> {
    const data: any = {};
    data["interval"] = interval;
    data["source"] = {
      OneDrive: toSnake({
        shareUrl: oneDriveShareUrl,
      }),
    };

    const result = await this.requestApi("snapshot_task", "post", true, data);
    if (result.ok) {
      result.ok = "ok";
    }
    return result;
  }

  public static async deleteSnapshotTask(): Promise<Result<"ok">> {
    const result = await this.requestApi("snapshot_task", "delete", true, {});
    if (result.ok) {
      result.ok = "ok";
    }
    return result;
  }

  public static async listSnapshots(
    page: number,
    perPage: number
  ): Promise<Result<SnapshotList>> {
    const result = await this.requestApi(
      "snapshot?page=" + String(page) + "&page_size=" + String(perPage),
      "get",
      true
    );
    if (result.ok) {
      result.ok = toCamel(result.ok);
    }
    return result;
  }

  public static async getSnapshotDownloadToken(
    snapshotId: number
  ): Promise<Result<string>> {
    const result = await this.requestApi(
      "snapshot/" + String(snapshotId) + "/download_token",
      "get",
      true
    );
    if (result.ok) {
      result.ok = result.ok.token;
    }
    return result;
  }
}
