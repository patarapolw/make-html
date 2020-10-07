package main

import (
	"log"
	"os/exec"
	"runtime"
	"strings"
)

func main() {
	cmdArgs := []string{"-jar"}

	platform := "gtk.linux.x86_64"

	switch runtime.GOOS {
	case "windows":
		platform = "win32.win32.x86_64"
	case "darwin":
		platform = "cocoa.macosx.x86_64"
		cmdArgs = append(cmdArgs, "-XstartOnFirstThread")
	}

	cmdArgs = append(cmdArgs, strings.Join([]string{"makehtml-", platform, ".jar"}, ""))

	err := exec.Command(
		"java",
		cmdArgs...,
	).Wait()

	if err != nil {
		log.Fatal(err)
	}
}
