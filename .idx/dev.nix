# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    # pkgs.python311
    # pkgs.go
    # pkgs.python311Packages.pip
    # pkgs.nodejs_20
    # pkgs.nodePackages.nodemon
  ];

  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];

     # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        # The following object sets web previews
        web = {
          command = [
            "npm"
            "run"
            "start"
            "--"
            "--port"
            "$PORT"
            "--host"
            "0.0.0.0"
            "--disable-host-check"
          ];
          manager = "web";
          # Optionally, specify a directory that contains your web app
          # cwd = "app/client";
        };
        # The following object sets Android previews
        # Note that this is supported only on Flutter workspaces
        android = {
          manager = "flutter";
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # Example: install JS dependencies from NPM
        # npm-install = "npm install";
      };
      # Runs when the workspace is (re)started
      onStart = {
        # Example: start a background task to watch and re-build backend code
        # watch-backend = "npm run watch-backend";
      };
    };
  };
}
