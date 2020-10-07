package main

import (
	"log"
	"os/exec"
	"runtime"
)

func main() {
	cmdArgs := []string{"-jar"}

	if runtime.GOOS == "darwin" {
		cmdArgs = append(cmdArgs, "-XstartOnFirstThread")
	}

	cmdArgs = append(cmdArgs, "makehtml.jar")

	cmd := exec.Command("java", cmdArgs...)

	if err := cmd.Start(); err != nil {
		log.Fatal(err)
	}

	if err := cmd.Wait(); err != nil {
		log.Fatal(err)
	}
}
