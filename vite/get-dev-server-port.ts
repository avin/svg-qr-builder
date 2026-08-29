import net from "node:net";

const defaultDevPort = 8888;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer();

    probe.once("error", () => resolve(false));
    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, "0.0.0.0");
  });
}

function getRandomAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();

    probe.once("error", reject);
    probe.once("listening", () => {
      const address = probe.address();

      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Не удалось определить случайный порт для dev-сервера"));
        return;
      }

      probe.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve(address.port);
        }
      });
    });
    probe.listen(0, "0.0.0.0");
  });
}

export async function getDevServerPort(isDevServer: boolean): Promise<number> {
  const configuredPort = Number(process.env.PORT) || defaultDevPort;

  if (
    !isDevServer ||
    configuredPort !== defaultDevPort ||
    (await isPortAvailable(configuredPort))
  ) {
    return configuredPort;
  }

  return getRandomAvailablePort();
}
