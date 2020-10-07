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

	err := exec.Command(
		"java",
		cmdArgs...,
	).Wait()

	if err != nil {
		log.Fatal(err)
	}
}
