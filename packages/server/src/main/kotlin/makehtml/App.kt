package makehtml

import makehtml.api.Api
import org.eclipse.swt.SWT
import org.eclipse.swt.browser.Browser
import org.eclipse.swt.browser.TitleListener
import org.eclipse.swt.layout.FillLayout
import org.eclipse.swt.widgets.Display
import org.eclipse.swt.widgets.Shell
import java.net.URL

fun main() {
    val display = Display()
    val shell = Shell(display)
    shell.maximized = true
    shell.text = "MakeHTML editor"

    val layout = FillLayout()

    val browser = Browser(shell, SWT.FILL)
    browser.addTitleListener { TitleListener {
        shell.text = it.title
    } }

    shell.layout = layout
    shell.open()

    val port = System.getenv("PORT")?.toInt() ?: 24000
    val url = URL("http://localhost:$port")

    val app = Api.server()

    shell.addDisposeListener {
        app.stop()
    }

    app.events {
        it.serverStarted {
            Display.getDefault().asyncExec {
                browser.url = url.toString()
            }
            while (!shell.isDisposed) {
                if (!display.readAndDispatch()) {
                    display.sleep()
                }
            }
        }
    }

    app.start(port)
}
